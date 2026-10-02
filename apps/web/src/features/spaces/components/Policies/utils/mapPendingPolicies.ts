import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { PendingPolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type {
  PendingPolicyOperation,
  PendingSpendingLimitPolicy,
  Policy,
  PolicyAllowance,
  PolicySafe,
  PolicySpender,
  SpendingLimitPolicy,
} from '../types'
import { unknownToken, type ResolveTokenInfo } from './mapActivePolicies'

type PendingChange = PendingPolicyDto['data']['changes'][number]
type ActiveSpendingLimit = SpendingLimitPolicy & { status: 'active' }

const isActiveSpendingLimit = (policy: Policy): policy is ActiveSpendingLimit =>
  policy.status === 'active' && policy.type === 'spending-limit'

const findActive = (safe: PolicySafe, moduleAddress: string, active: Policy[]): ActiveSpendingLimit | undefined =>
  active
    .filter(isActiveSpendingLimit)
    .find(
      (policy) =>
        policy.safe.chainId === safe.chainId &&
        sameAddress(policy.safe.address, safe.address) &&
        policy.enforcement.via === 'module' &&
        sameAddress(policy.enforcement.moduleAddress, moduleAddress),
    )

const findActiveAllowance = (
  active: ActiveSpendingLimit | undefined,
  delegate: string,
  token: string,
): PolicyAllowance | undefined =>
  active?.data.spenders
    .find((spender) => sameAddress(spender.spender, delegate))
    ?.allowances.find((allowance) => sameAddress(allowance.token.address, token))

const getOperation = (changes: PendingChange[], active: ActiveSpendingLimit | undefined): PendingPolicyOperation => {
  if (changes.every((change) => change.kind === 'remove-delegate' || change.kind === 'delete-allowance')) {
    return 'remove'
  }

  // Not `add-delegate`: an edit re-registers every spender it writes to, so it says nothing about the policy existing.
  const createsPolicy = !active || changes.some((change) => change.kind === 'enable-module')

  return createsPolicy ? 'create' : 'update'
}

const toSpenders = (
  dto: PendingPolicyDto,
  active: ActiveSpendingLimit | undefined,
  resolveToken: ResolveTokenInfo,
): PolicySpender[] => {
  const byDelegate = new Map<string, PolicySpender>()
  const spenderFor = (delegate: string): PolicySpender => {
    const key = delegate.toLowerCase()
    const spender = byDelegate.get(key) ?? { spender: delegate, allowances: [] }
    byDelegate.set(key, spender)
    return spender
  }
  const findQueuedAllowance = (delegate: string, token: string): PolicyAllowance | undefined =>
    byDelegate.get(delegate.toLowerCase())?.allowances.find((allowance) => sameAddress(allowance.token.address, token))
  const upsertAllowance = (delegate: string, allowance: PolicyAllowance) => {
    const { allowances } = spenderFor(delegate)
    const index = allowances.findIndex((existing) => sameAddress(existing.token.address, allowance.token.address))
    if (index === -1) allowances.push(allowance)
    else allowances[index] = allowance
  }

  for (const change of dto.data.changes) {
    switch (change.kind) {
      case 'enable-module':
        break
      case 'add-delegate':
        spenderFor(change.delegate)
        break
      case 'remove-delegate': {
        const current = active?.data.spenders.find((spender) => sameAddress(spender.spender, change.delegate))
        spenderFor(change.delegate).allowances.push(...(current?.allowances ?? []))
        break
      }
      case 'set-allowance': {
        // A used limit is edited as reset then set, so the set starts from the reset allowance, not the active one.
        const current =
          findQueuedAllowance(change.delegate, change.token) ??
          findActiveAllowance(active, change.delegate, change.token)
        const spent = current?.spent ?? '0'
        const remaining = BigInt(change.amount) - BigInt(spent)

        upsertAllowance(change.delegate, {
          token: resolveToken(dto.safe.chainId, change.token) ?? unknownToken(change.token),
          amount: change.amount,
          spent,
          remaining: (remaining > 0n ? remaining : 0n).toString(),
          resetPeriodMinutes: change.resetPeriodMinutes,
          resetsAtMinute: change.resetPeriodMinutes === 0 ? null : (current?.resetsAtMinute ?? null),
        })
        break
      }
      case 'reset-allowance': {
        const current =
          findQueuedAllowance(change.delegate, change.token) ??
          findActiveAllowance(active, change.delegate, change.token)
        if (current) upsertAllowance(change.delegate, { ...current, spent: '0', remaining: current.amount })
        break
      }
      case 'delete-allowance': {
        const current = findActiveAllowance(active, change.delegate, change.token)
        if (current) spenderFor(change.delegate).allowances.push(current)
        break
      }
    }
  }

  return [...byDelegate.values()]
}

/** The id CGW's transactions endpoint knows a queued Safe transaction by. */
export const getPendingTxId = ({ safe, safeTxHash }: Pick<PendingSpendingLimitPolicy, 'safe' | 'safeTxHash'>): string =>
  `multisig_${safe.address}_${safeTxHash}`

/** One row per queued transaction and module, shown beside the active rows. */
export const mapPendingPolicies = (
  dtos: PendingPolicyDto[],
  active: Policy[],
  resolveToken: ResolveTokenInfo,
): PendingSpendingLimitPolicy[] =>
  dtos.flatMap((dto) => {
    if (dto.type !== 'spending-limit' || dto.data.changes.length === 0) return []

    const current = findActive(dto.safe, dto.enforcement.moduleAddress, active)
    const operation = getOperation(dto.data.changes, current)

    return [
      {
        id: `pending:${dto.safe.chainId}:${dto.safeTxHash}:${dto.data.module}`,
        type: 'spending-limit',
        status: 'pending',
        safe: dto.safe,
        enforcement: dto.enforcement,
        enabled: current?.enabled ?? true,
        operation,
        safeTxHash: dto.safeTxHash,
        nonce: dto.nonce,
        confirmationsSubmitted: dto.confirmations,
        confirmationsRequired: dto.confirmationsRequired,
        proposedAt: dto.proposedAt,
        data: { spenders: toSpenders(dto, current, resolveToken) },
      },
    ]
  })

const isAllowanceIndexed = (queued: PolicyAllowance, indexed: PolicyAllowance | undefined): boolean =>
  indexed !== undefined &&
  indexed.amount === queued.amount &&
  indexed.resetPeriodMinutes === queued.resetPeriodMinutes &&
  (queued.spent !== '0' || indexed.spent === '0')

/** Whether the active rows already show what an executed queued row changed. */
export const isPendingChangeIndexed = (row: PendingSpendingLimitPolicy, active: Policy[]): boolean => {
  const current =
    row.enforcement.via === 'module' ? findActive(row.safe, row.enforcement.moduleAddress, active) : undefined
  const findSpender = (delegate: string) =>
    current?.data.spenders.find((spender) => sameAddress(spender.spender, delegate))

  if (row.operation === 'remove') {
    return row.data.spenders.every(({ spender, allowances }) =>
      allowances.length === 0
        ? !findSpender(spender)
        : allowances.every((allowance) => !findActiveAllowance(current, spender, allowance.token.address)),
    )
  }

  return (
    current !== undefined &&
    row.data.spenders.every(
      ({ spender, allowances }) =>
        findSpender(spender) !== undefined &&
        allowances.every((allowance) =>
          isAllowanceIndexed(allowance, findActiveAllowance(current, spender, allowance.token.address)),
        ),
    )
  )
}
