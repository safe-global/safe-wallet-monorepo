import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type {
  PendingDelayedGuardPoliciesDto,
  PolicyConfigurationDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  isActiveAllowlistPolicy,
  type AllowlistEntry,
  type AllowlistPolicyData,
  type Policy,
  type PolicyTokenInfo,
  type QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { isAllowlistRemoval, isGuardRemovalCleanup } from '@/features/policy-guard/public/services/guardExit'
import type { PolicyConfiguration } from '@/features/policy-guard/public/types'
import type { ActiveAllowlistPolicy } from '../AllowlistDrawer/resolveState'
import type { ApplyAllowlistFlowData } from '../ApplyAllowlistFlow/types'
import {
  applyAllowlistRequest,
  decodeRecipients,
  ERC20_TRANSFER_SELECTOR,
  NATIVE_TRANSFER_SELECTOR,
} from './applyAllowlistRequest'

type MapOptions = {
  /** `update` when the Safe already enforces an allowlist, so the request changes it; `remove` when it deletes it. */
  operation: 'create' | 'update' | 'remove'
  resolveToken: (address: string) => PolicyTokenInfo
}

/**
 * One entry per token, the way the drawer lists them. Accesses other than token and native transfers are skipped,
 * as are the guard's catch-all rules and unbound token or native rules, which name no recipient.
 */
export const toAllowlistData = (
  configurations: readonly PolicyConfigurationDto[],
  resolveToken: MapOptions['resolveToken'],
): AllowlistPolicyData => {
  const entries: AllowlistEntry[] = []
  const entryFor = (tokenAddress: string): AllowlistEntry => {
    const existing = entries.find(({ token }) => sameAddress(token.address, tokenAddress))
    if (existing) return existing
    const entry = { token: resolveToken(tokenAddress), recipients: [] }
    entries.push(entry)
    return entry
  }

  for (const { target, selector, policy, data } of configurations) {
    if (selector === ERC20_TRANSFER_SELECTOR && !sameAddress(policy, ZERO_ADDRESS)) {
      const { recipients, revoked } = decodeRecipients(data)
      if (recipients.length > 0 || revoked.length === 0) entryFor(target).recipients.push(...recipients)
    } else if (
      selector === NATIVE_TRANSFER_SELECTOR &&
      !sameAddress(target, ZERO_ADDRESS) &&
      !sameAddress(policy, ZERO_ADDRESS)
    ) {
      entryFor(ZERO_ADDRESS).recipients.push({ account: target, permission: 'ALWAYS' })
    }
  }

  return { entries }
}

/**
 * A delayed allowlist change as the drawer shows it: its `requestConfiguration` or `applyConfiguration` queued, or
 * requested and waiting for, past or out of its apply window. Drafts have no transaction to show.
 */
export const mapDelayedGuardRequest = (
  dto: PendingDelayedGuardPoliciesDto,
  { operation, resolveToken }: MapOptions,
): ActiveAllowlistPolicy | QueuedAllowlistPolicy | undefined => {
  if (!dto.guard || !dto.configurations) return undefined

  const base = {
    id: `${dto.safe.chainId}:${dto.safe.address}:${dto.root}`,
    type: 'allowlist',
    safe: dto.safe,
    enforcement: { via: 'guard', guardAddress: dto.guard },
    enabled: true,
    data: toAllowlistData(dto.configurations, resolveToken),
    // The wallet's setup sets both guard slots, so the Safe's spending limits follow the allowlist too.
    spendingLimitsCovered: true,
  } as const

  switch (dto.status) {
    case 'pending-application':
    case 'expired':
      if (dto.readyAt === null) return undefined
      return {
        ...base,
        status: 'active',
        scheduledChange: {
          operation,
          appliesAt: dto.readyAt,
          expiresAt: dto.expiresAt ?? undefined,
          requestedAt: dto.createdAt ?? undefined,
          root: dto.root,
        },
      }

    case 'configuration-in-signing':
    case 'application-in-signing':
    case 'application-ready':
      if (!dto.transaction) return undefined
      return {
        ...base,
        status: 'pending',
        operation,
        safeTxHash: dto.transaction.safeTxHash,
        nonce: dto.transaction.nonce,
        confirmationsSubmitted: dto.transaction.confirmations,
        confirmationsRequired: dto.transaction.confirmationsRequired,
        proposedAt: dto.transaction.proposedAt,
        expiresAt: dto.expiresAt ?? undefined,
        step: dto.status === 'configuration-in-signing' ? 'request' : 'apply',
        root: dto.root,
      }

    default:
      return undefined
  }
}

/** What the apply flow needs to replay the request, once CGW knows its configurations. */
export const getApplyAllowlistRequest = (dto: PendingDelayedGuardPoliciesDto): ApplyAllowlistFlowData | undefined =>
  dto.guard && dto.configurations
    ? {
        chainId: dto.safe.chainId,
        safeAddress: dto.safe.address,
        guardAddress: dto.guard,
        configurations: dto.configurations,
      }
    : undefined

/** A removal's second root, which the guard removal applies in the same batch while its window is open. */
export type GuardRemovalCleanup = {
  configurations: PolicyConfiguration[]
  /** Unix SECONDS. */
  readyAt: number
  /** Unix SECONDS. */
  expiresAt: number
}

/** The cleanup's configurations while they can be applied; outside its window `applyConfiguration` would revert. */
export const getApplicableCleanup = (
  cleanup: GuardRemovalCleanup | undefined,
  nowMs: number,
): PolicyConfiguration[] | undefined =>
  cleanup && cleanup.readyAt * 1_000 <= nowMs && nowMs < cleanup.expiresAt * 1_000 ? cleanup.configurations : undefined

export type MergedDelayedGuardRequests = {
  /** The active rows, each live allowlist showing the change it waits for, then a first allowlist's rows. */
  policies: Policy[]
  /** What the apply flow replays, keyed by the row id that offers it. */
  applyRequests: ReadonlyMap<string, ApplyAllowlistFlowData>
  /** A removal's second root, keyed by the row id of the allowlist it removes. */
  guardRemovalCleanups: ReadonlyMap<string, GuardRemovalCleanup>
}

// When a Safe has several requests, the one closest to running on chain is the change its row shows.
const STATUS_RANK: Record<PendingDelayedGuardPoliciesDto['status'], number> = {
  'application-ready': 5,
  'application-in-signing': 4,
  'pending-application': 3,
  'configuration-in-signing': 2,
  expired: 1,
  draft: 0,
}

const toGuardRemovalCleanup = (dto: PendingDelayedGuardPoliciesDto): GuardRemovalCleanup | undefined =>
  dto.status === 'pending-application' && dto.configurations && dto.readyAt !== null && dto.expiresAt !== null
    ? { configurations: dto.configurations, readyAt: dto.readyAt, expiresAt: dto.expiresAt }
    : undefined

export const mergeDelayedGuardRequests = (
  dtos: readonly PendingDelayedGuardPoliciesDto[],
  active: readonly Policy[],
  resolveToken: (chainId: string, address: string) => PolicyTokenInfo,
): MergedDelayedGuardRequests => {
  const changed = new Map<string, Policy>()
  const added: Policy[] = []
  const applyRequests = new Map<string, ApplyAllowlistFlowData>()
  const guardRemovalCleanups = new Map<string, GuardRemovalCleanup>()

  for (const dto of [...dtos].sort((a, b) => STATUS_RANK[b.status] - STATUS_RANK[a.status])) {
    const live = active.find(
      (policy): policy is ActiveAllowlistPolicy =>
        isActiveAllowlistPolicy(policy) &&
        policy.safe.chainId === dto.safe.chainId &&
        sameAddress(policy.safe.address, dto.safe.address),
    )
    if (dto.configurations && isGuardRemovalCleanup(dto.configurations, dto.safe.address)) {
      const cleanup = toGuardRemovalCleanup(dto)
      if (live && cleanup) guardRemovalCleanups.set(live.id, cleanup)
      continue
    }
    if (live && changed.has(live.id)) continue

    const isRemoval = !!dto.configurations && isAllowlistRemoval(dto.configurations, dto.safe.address)
    const resolveRequestToken = (address: string) => resolveToken(dto.safe.chainId, address)
    const row = mapDelayedGuardRequest(dto, {
      operation: isRemoval ? 'remove' : live ? 'update' : 'create',
      resolveToken: resolveRequestToken,
    })
    if (!row) continue

    let data = row.data
    if (live && dto.configurations) {
      // A removal's configurations name no recipients, so its row lists the live ones it takes away.
      data = isRemoval ? live.data : applyAllowlistRequest(live.data, dto.configurations, resolveRequestToken)
    }
    let merged: Policy = { ...row, data }
    if (live && row.status === 'active') merged = { ...live, data, scheduledChange: row.scheduledChange }
    if (live && row.status === 'pending') merged = { ...row, id: live.id, data }

    if (live) changed.set(live.id, merged)
    else added.push(merged)
    const request = getApplyAllowlistRequest(dto)
    if (request) applyRequests.set(merged.id, request)
  }

  return {
    policies: [...active.map((policy) => changed.get(policy.id) ?? policy), ...added],
    applyRequests,
    guardRemovalCleanups,
  }
}
