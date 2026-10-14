import type {
  ActivePolicyDto,
  Erc20TransferPolicyDataDto,
  ProposerPolicyDataDto,
  SpendingLimitAllowanceDto,
  SpendingLimitPolicyDataDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type {
  MultiSendPolicy,
  Policy,
  PolicyAllowance,
  ProposerPolicy,
  SafeManagementChange,
  SafeManagementPolicy,
  SpendingLimitPolicy,
  TokenAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { SAFE_MANAGEMENT_FUNCTIONS, safeManagementFunctionBySelector } from '../SafeManagementPolicy/contracts'
import { toPolicyToken } from './toPolicyToken'

const toAllowance = (allowance: SpendingLimitAllowanceDto): PolicyAllowance => {
  const remaining = BigInt(allowance.amount) - BigInt(allowance.spent)

  return {
    token: toPolicyToken(allowance.tokenAddress, allowance.tokenMetadata),
    amount: allowance.amount,
    spent: allowance.spent,
    remaining: (remaining > 0n ? remaining : 0n).toString(),
    resetPeriodMinutes: allowance.resetPeriodMinutes,
    resetsAtMinute: allowance.resetsAtMinute,
    createdAt: allowance.createdAt,
  }
}

const isSpendingLimitData = (data: ActivePolicyDto['data']): data is SpendingLimitPolicyDataDto => 'spenders' in data

const isProposerData = (data: ActivePolicyDto['data']): data is ProposerPolicyDataDto => 'proposers' in data

/** Deleting the last allowance leaves the module enabled, so a revoked policy keeps coming back empty. */
const hasNoAllowances = (data: SpendingLimitPolicyDataDto): boolean =>
  data.spenders.every((spender) => spender.allowances.length === 0)

const toSpendingLimit = (dto: ActivePolicyDto): SpendingLimitPolicy | null => {
  if (dto.enforcement.via !== 'module' || !isSpendingLimitData(dto.data)) return null
  if (hasNoAllowances(dto.data)) return null

  return {
    id: `spending-limit:${dto.safe.chainId}:${dto.safe.address}:${dto.data.module}`,
    type: 'spending-limit',
    safe: dto.safe,
    enforcement: dto.enforcement,
    enabled: dto.enabled,
    data: {
      spenders: dto.data.spenders.map((spender) => ({
        spender: spender.spender,
        allowances: spender.allowances.map(toAllowance),
      })),
    },
  }
}

/** The drawer describes one proposer, so each proposer on a Safe gets its own row. */
const toProposers = (dto: ActivePolicyDto): ProposerPolicy[] => {
  if (dto.enforcement.via !== 'offchain' || !isProposerData(dto.data)) return []

  const { enforcement } = dto

  return dto.data.proposers.map((proposer) => ({
    id: `proposer:${dto.safe.chainId}:${dto.safe.address}:${proposer.proposer}`,
    type: 'proposer',
    safe: dto.safe,
    enforcement,
    enabled: dto.enabled,
    data: { proposers: [proposer] },
  }))
}

const isAllowlistData = (data: ActivePolicyDto['data']): data is Erc20TransferPolicyDataDto =>
  'tokenAddress' in data && 'recipients' in data

/** The guard keys a policy by its access, so that is what makes a row unique. */
const guardId = (prefix: string, dto: ActivePolicyDto): string | null => {
  if (dto.enforcement.via !== 'guard') return null
  const { target, selector, operation } = dto.enforcement.access
  return `${prefix}:${dto.safe.chainId}:${dto.safe.address}:${target}:${selector}:${operation}`
}

const toTokenAllowlist = (dto: ActivePolicyDto): TokenAllowlistPolicy | null => {
  const id = guardId('token-allowlist', dto)
  if (!id || dto.enforcement.via !== 'guard' || !isAllowlistData(dto.data)) return null

  return {
    id,
    type: 'token-allowlist',
    safe: dto.safe,
    enforcement: { via: 'guard', access: dto.enforcement.access },
    enabled: dto.enabled,
    data: {
      // The allowlist DTO carries no `tokenMetadata`, unlike a spending limit allowance, so the
      // token renders as its address until the gateway sends one.
      token: toPolicyToken(dto.data.tokenAddress, null),
      recipients: dto.data.recipients.map((recipient) => ({
        address: recipient.account,
        permission: recipient.permission,
      })),
    },
  }
}

const toMultiSend = (dto: ActivePolicyDto): MultiSendPolicy | null => {
  const id = guardId('multisend', dto)
  if (!id || dto.enforcement.via !== 'guard') return null

  return {
    id,
    type: 'multisend',
    safe: dto.safe,
    enforcement: { via: 'guard', access: dto.enforcement.access },
    enabled: dto.enabled,
    data: {},
  }
}

/**
 * The management selector an `allow` policy keeps permitted, or null when it is not one: an `allow`
 * on anything but the Safe itself, on an unknown selector, is the guard's catch-all fallback.
 */
const toManagementChange = (dto: ActivePolicyDto): SafeManagementChange | null => {
  if (dto.enforcement.via !== 'guard' || !dto.enforcement.access) return null

  const { target, selector, operation } = dto.enforcement.access
  if (operation !== 'CALL') return null
  if (target.toLowerCase() !== dto.safe.address.toLowerCase()) return null

  const fn = safeManagementFunctionBySelector(selector)
  return fn ? { selector, label: fn.label } : null
}

/**
 * The guard stores one policy per selector, but a Safe's management rules read as one thing, so
 * every permitted change on a Safe becomes a single row.
 */
const toSafeManagementRows = (dtos: ActivePolicyDto[]): SafeManagementPolicy[] => {
  const bySafe = new Map<string, { safe: ActivePolicyDto['safe']; enabled: boolean; changes: SafeManagementChange[] }>()

  for (const dto of dtos) {
    if (dto.type !== 'allow') continue
    const change = toManagementChange(dto)
    if (!change) continue

    const key = `${dto.safe.chainId}:${dto.safe.address.toLowerCase()}`
    const group = bySafe.get(key)
    if (group) {
      group.changes.push(change)
      // One disabled binding means the Safe's management rules are not fully in force.
      group.enabled = group.enabled && dto.enabled
    } else {
      bySafe.set(key, { safe: dto.safe, enabled: dto.enabled, changes: [change] })
    }
  }

  return [...bySafe.entries()].map(([key, { safe, enabled, changes }]) => ({
    id: `safe-management:${key}`,
    type: 'safe-management',
    safe,
    enforcement: { via: 'guard' },
    enabled,
    data: { changes, total: SAFE_MANAGEMENT_FUNCTIONS.length },
  }))
}

const toPolicies = (dto: ActivePolicyDto): Policy[] => {
  switch (dto.type) {
    case 'spending-limit': {
      const policy = toSpendingLimit(dto)
      return policy ? [{ ...policy, status: 'active' }] : []
    }
    case 'proposer':
      return toProposers(dto).map((policy) => ({ ...policy, status: 'active' }))
    case 'erc20-transfer': {
      const policy = toTokenAllowlist(dto)
      return policy ? [{ ...policy, status: 'active' }] : []
    }
    case 'multisend': {
      const policy = toMultiSend(dto)
      return policy ? [{ ...policy, status: 'active' }] : []
    }
    default:
      return []
  }
}

/**
 * Turns the gateway's active policies into the shapes the Policies table renders.
 *
 * @param dtos - Active policies as the gateway returns them; an allowance without token metadata falls back to base units.
 * @returns One entry per policy the page can render. Left out: a policy of a type the page does not
 *   render, one whose data has another type's shape, and a spending limit whose allowances are all
 *   gone — deleting the last allowance leaves the module enabled, so the gateway keeps returning it.
 */
export const mapActivePolicies = (dtos: ActivePolicyDto[]): Policy[] => [
  ...dtos.flatMap(toPolicies),
  // Grouped across the response rather than per DTO: one row holds every change a Safe permits.
  ...toSafeManagementRows(dtos).map((policy) => ({ ...policy, status: 'active' as const })),
]
