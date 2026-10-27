import { NATIVE_TRANSFER_SELECTOR } from '@safe-global/utils/features/policy-guard/constants'
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

/** CGW sends an ERC-20 policy by token address only; `undefined` keeps the address as the symbol. */
export type Erc20TokenResolver = (chainId: string, tokenAddress: string) => PolicyTokenInfo | undefined

const NO_ERC20_TOKEN: Erc20TokenResolver = () => undefined

export const toChainAddressKey = (chainId: string, address: string): string => `${chainId}:${address.toLowerCase()}`

type GuardEnforcement = Extract<ActivePolicyDto['enforcement'], { via: 'guard' }>

type Erc20AllowlistDto = ActivePolicyDto & {
  type: 'erc20-transfer'
  enforcement: GuardEnforcement
  data: Erc20TransferPolicyDataDto
}
type NativeAllowlistDto = ActivePolicyDto & { type: 'native-transfer'; enforcement: GuardEnforcement }
type AllowlistDto = Erc20AllowlistDto | NativeAllowlistDto

type AllowlistGroup = {
  safe: PolicySafe
  enabled: boolean
  spendingLimitsCovered: boolean
  guardAddress?: string
  tokens: Map<string, AllowlistEntry>
  nativeRecipients: AllowlistRecipient[]
}

const isAllowlistDto = (dto: ActivePolicyDto): dto is AllowlistDto =>
  dto.enforcement.via === 'guard' &&
  (dto.type === 'native-transfer' || (dto.type === 'erc20-transfer' && 'tokenAddress' in dto.data))

/** CGW calls a policy enabled when either slot holds the guard, but owner transactions go through the transaction slot. */
const isEnforced = (guards: GuardSlotsDto): boolean => !!guards.transactionGuard

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

  const { tokenAddress, recipients } = dto.data
  const key = tokenAddress.toLowerCase()
  const entry = group.tokens.get(key) ?? { token: toPolicyToken(tokenAddress, null), recipients: [] }
  group.tokens.set(key, { ...entry, recipients: addRecipients(entry.recipients, recipients) })
}

const toAllowlist = (
  key: string,
  group: AllowlistGroup,
  resolveNativeToken: NativeTokenResolver,
  resolveErc20Token: Erc20TokenResolver,
): AllowlistPolicy[] => {
  const { chainId } = group.safe
  const nativeToken = group.nativeRecipients.length > 0 ? resolveNativeToken(chainId) : undefined
  const entries = [
    ...(nativeToken ? [{ token: nativeToken, recipients: group.nativeRecipients }] : []),
    ...[...group.tokens.values()].map((entry) => ({
      ...entry,
      token: resolveErc20Token(chainId, entry.token.address) ?? entry.token,
    })),
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
      spendingLimitsCovered: group.spendingLimitsCovered,
      data: { entries },
    },
  ]
}

/** CGW sends one policy per token and per ETH recipient; the table shows one allowlist per Safe. */
export const toAllowlists = (
  dtos: ActivePolicyDto[],
  resolveNativeToken: NativeTokenResolver,
  resolveErc20Token: Erc20TokenResolver = NO_ERC20_TOKEN,
): AllowlistPolicy[] => {
  const bySafe = new Map<string, AllowlistGroup>()

  for (const dto of dtos) {
    if (!isAllowlistDto(dto)) continue

    const key = toChainAddressKey(dto.safe.chainId, dto.safe.address)
    const { guards } = dto.enforcement
    const group: AllowlistGroup = bySafe.get(key) ?? {
      safe: dto.safe,
      enabled: true,
      spendingLimitsCovered: true,
      tokens: new Map(),
      nativeRecipients: [],
    }

    group.enabled = group.enabled && isEnforced(guards)
    group.spendingLimitsCovered = group.spendingLimitsCovered && !!guards.moduleGuard
    group.guardAddress ??= (guards.transactionGuard ?? guards.moduleGuard)?.safePolicyGuard
    addToGroup(group, dto)
    bySafe.set(key, group)
  }

  return [...bySafe].flatMap(([key, group]) => toAllowlist(key, group, resolveNativeToken, resolveErc20Token))
}

/** The distinct ERC-20 addresses per chain, lower-cased and sorted so the same set always makes the same request. */
export const getAllowlistTokenAddresses = (dtos: ActivePolicyDto[]): Map<string, string[]> => {
  const byChain = new Map<string, Set<string>>()

  for (const dto of dtos) {
    if (!isAllowlistDto(dto) || dto.type !== 'erc20-transfer') continue
    const addresses = byChain.get(dto.safe.chainId) ?? new Set<string>()
    addresses.add(dto.data.tokenAddress.toLowerCase())
    byChain.set(dto.safe.chainId, addresses)
  }

  return new Map([...byChain].map(([chainId, addresses]) => [chainId, [...addresses].sort()]))
}
