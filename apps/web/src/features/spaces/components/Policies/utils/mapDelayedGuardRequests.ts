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
import { isAllowlistRemoval } from '@/features/policy-guard/services'
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

export type MergedDelayedGuardRequests = {
  /** Rows of their own beside the live allowlist: a request waiting for its apply, or any queued transaction. */
  added: Policy[]
  /** What the apply flow replays, keyed by the row id that offers it. */
  applyRequests: ReadonlyMap<string, ApplyAllowlistFlowData>
}

export const mergeDelayedGuardRequests = (
  dtos: readonly PendingDelayedGuardPoliciesDto[],
  active: readonly Policy[],
  resolveToken: (chainId: string, address: string) => PolicyTokenInfo,
): MergedDelayedGuardRequests => {
  const added: Policy[] = []
  const applyRequests = new Map<string, ApplyAllowlistFlowData>()

  for (const dto of dtos) {
    const live = active.find(
      (policy): policy is ActiveAllowlistPolicy =>
        isActiveAllowlistPolicy(policy) &&
        policy.safe.chainId === dto.safe.chainId &&
        sameAddress(policy.safe.address, dto.safe.address),
    )
    const isRemoval = !!dto.configurations && isAllowlistRemoval(dto.configurations, dto.safe.address)
    const resolveRequestToken = (address: string) => resolveToken(dto.safe.chainId, address)
    const row = mapDelayedGuardRequest(dto, {
      operation: isRemoval ? 'remove' : live ? 'update' : 'create',
      resolveToken: resolveRequestToken,
    })
    if (!row) continue

    // A removal's configurations name no recipients, so its row lists the live ones it takes away.
    const data =
      live && dto.configurations
        ? isRemoval
          ? live.data
          : applyAllowlistRequest(live.data, dto.configurations, resolveRequestToken)
        : row.data
    added.push({ ...row, data })
    const request = getApplyAllowlistRequest(dto)
    if (request) applyRequests.set(row.id, request)
  }

  return { added, applyRequests }
}
