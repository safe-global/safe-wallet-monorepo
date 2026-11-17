import { AbiCoder } from 'ethers'
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
  type AllowlistRecipient,
  type Policy,
  type PolicyTokenInfo,
  type QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import type { ActiveAllowlistPolicy } from '../AllowlistDrawer/resolveState'
import type { ApplyAllowlistFlowData } from '../ApplyAllowlistFlow/types'

const ERC20_TRANSFER_SELECTOR = '0xa9059cbb'
const NATIVE_TRANSFER_SELECTOR = '0x00000000'
const PERMISSIONS: Record<number, AllowlistRecipient['permission']> = { 1: 'ONCE', 2: 'ALWAYS' }

type MapOptions = {
  /** `update` when the Safe already enforces an allowlist, so the request changes it. */
  operation: 'create' | 'update'
  resolveToken: (address: string) => PolicyTokenInfo
}

const decodeRecipients = (data: string): AllowlistRecipient[] => {
  const [entries] = AbiCoder.defaultAbiCoder().decode(['tuple(address recipient, uint8 permission)[]'], data)

  return (entries as Array<[string, bigint]>).map(([account, permission]) => ({
    account,
    permission: PERMISSIONS[Number(permission)] ?? 'ALWAYS',
  }))
}

/** One entry per token, the way the drawer lists them. Accesses other than token and native transfers are skipped. */
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

  for (const { target, selector, data } of configurations) {
    if (selector === ERC20_TRANSFER_SELECTOR) entryFor(target).recipients.push(...decodeRecipients(data))
    else if (selector === NATIVE_TRANSFER_SELECTOR)
      entryFor(ZERO_ADDRESS).recipients.push({ account: target, permission: 'ALWAYS' })
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
  /** The active rows, with a waiting or expired request folded into the Safe's live allowlist as an `update`. */
  active: Policy[]
  /** Rows of their own: a first allowlist waiting for its apply, or any queued apply. */
  added: Policy[]
  /** What the apply flow replays, keyed by the row id that offers it. */
  applyRequests: ReadonlyMap<string, ApplyAllowlistFlowData>
}

export const mergeDelayedGuardRequests = (
  dtos: readonly PendingDelayedGuardPoliciesDto[],
  active: readonly Policy[],
  resolveToken: (chainId: string, address: string) => PolicyTokenInfo,
): MergedDelayedGuardRequests => {
  const replaced = new Map<string, Policy>()
  const added: Policy[] = []
  const applyRequests = new Map<string, ApplyAllowlistFlowData>()

  for (const dto of dtos) {
    const live = active.find(
      (policy): policy is ActiveAllowlistPolicy =>
        isActiveAllowlistPolicy(policy) &&
        policy.safe.chainId === dto.safe.chainId &&
        sameAddress(policy.safe.address, dto.safe.address),
    )
    const row = mapDelayedGuardRequest(dto, {
      operation: live ? 'update' : 'create',
      resolveToken: (address) => resolveToken(dto.safe.chainId, address),
    })
    if (!row) continue

    const request = getApplyAllowlistRequest(dto)
    if (live && row.status === 'active') {
      replaced.set(live.id, { ...live, scheduledChange: row.scheduledChange })
      if (request) applyRequests.set(live.id, request)
      continue
    }

    added.push(row)
    if (request) applyRequests.set(row.id, request)
  }

  return { active: active.map((policy) => replaced.get(policy.id) ?? policy), added, applyRequests }
}
