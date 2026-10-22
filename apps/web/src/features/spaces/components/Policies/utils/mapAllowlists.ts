import type {
  ActivePolicyDto,
  Erc20TransferPolicyDataDto,
  GuardSlotsDto,
  PolicyAccessDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type {
  AllowlistEntry,
  AllowlistPolicy,
  AllowlistRecipient,
  PolicySafe,
  PolicyTokenInfo,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { getPolicyGuardAddress } from '@/features/policy-guard/services'
import { toPolicyToken } from './toPolicyToken'

export type NativeTokenResolver = (chainId: string) => PolicyTokenInfo | undefined

const NATIVE_TRANSFER_SELECTOR = '0x00000000'

type AllowlistDto = ActivePolicyDto & { enforcement: Extract<ActivePolicyDto['enforcement'], { via: 'guard' }> }

type AllowlistGroup = {
  safe: PolicySafe
  enabled: boolean
  guardAddress?: string
  tokens: Map<string, AllowlistEntry>
  nativeRecipients: AllowlistRecipient[]
}

const isAllowlistDto = (dto: ActivePolicyDto): dto is AllowlistDto =>
  (dto.type === 'erc20-transfer' || dto.type === 'native-transfer') && dto.enforcement.via === 'guard'

const isAllowlistData = (data: ActivePolicyDto['data']): data is Erc20TransferPolicyDataDto => 'tokenAddress' in data

/** CGW calls a policy enabled when either slot holds the guard, but an empty slot leaves one path unchecked. */
const isEnforced = (guards: GuardSlotsDto): boolean => !!guards.transactionGuard && !!guards.moduleGuard

const toNativeRecipient = ({ target, selector, operation }: PolicyAccessDto): string | null => {
  if (operation !== 'CALL' || selector.toLowerCase() !== NATIVE_TRANSFER_SELECTOR) return null
  // The zero target is the guard's catch-all rule, not a recipient.
  if (sameAddress(target, ZERO_ADDRESS)) return null

  return target
}

const addRecipients = (current: AllowlistRecipient[], added: AllowlistRecipient[]): AllowlistRecipient[] => [
  ...current,
  ...added.filter((recipient) => !current.some(({ account }) => sameAddress(account, recipient.account))),
]

/** A token's `transfer` and `transferFrom` policies are one entry to a reader. */
const addToGroup = (group: AllowlistGroup, dto: AllowlistDto): void => {
  if (dto.type === 'native-transfer') {
    const recipient = toNativeRecipient(dto.enforcement.access)
    // The native policy has no permission, so a listed recipient is allowed outright.
    if (recipient)
      group.nativeRecipients = addRecipients(group.nativeRecipients, [{ account: recipient, permission: 'ALWAYS' }])
    return
  }
  if (!isAllowlistData(dto.data)) return

  const { tokenAddress, recipients } = dto.data
  const key = tokenAddress.toLowerCase()
  const entry = group.tokens.get(key) ?? { token: toPolicyToken(tokenAddress, null), recipients: [] }
  group.tokens.set(key, { ...entry, recipients: addRecipients(entry.recipients, recipients) })
}

const toAllowlist = (
  key: string,
  group: AllowlistGroup,
  resolveNativeToken: NativeTokenResolver,
): AllowlistPolicy[] => {
  const nativeToken = group.nativeRecipients.length > 0 ? resolveNativeToken(group.safe.chainId) : undefined
  const entries = [
    ...(nativeToken ? [{ token: nativeToken, recipients: group.nativeRecipients }] : []),
    ...group.tokens.values(),
  ]
  if (entries.length === 0) return []

  return [
    {
      id: `allowlist:${key}`,
      type: 'allowlist',
      safe: group.safe,
      enforcement: {
        via: 'guard',
        guardAddress: group.guardAddress ?? getPolicyGuardAddress(group.safe.chainId) ?? '',
      },
      enabled: group.enabled,
      data: { entries },
    },
  ]
}

/** CGW sends one policy per token and per ETH recipient; the table shows one allowlist per Safe. */
export const toAllowlists = (dtos: ActivePolicyDto[], resolveNativeToken: NativeTokenResolver): AllowlistPolicy[] => {
  const bySafe = new Map<string, AllowlistGroup>()

  for (const dto of dtos) {
    if (!isAllowlistDto(dto)) continue

    const key = `${dto.safe.chainId}:${dto.safe.address.toLowerCase()}`
    const { guards } = dto.enforcement
    const group: AllowlistGroup = bySafe.get(key) ?? {
      safe: dto.safe,
      enabled: true,
      tokens: new Map(),
      nativeRecipients: [],
    }

    group.enabled = group.enabled && isEnforced(guards)
    group.guardAddress ??= (guards.transactionGuard ?? guards.moduleGuard)?.safePolicyGuard
    addToGroup(group, dto)
    bySafe.set(key, group)
  }

  return [...bySafe].flatMap(([key, group]) => toAllowlist(key, group, resolveNativeToken))
}
