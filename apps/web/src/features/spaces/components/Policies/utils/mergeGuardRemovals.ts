import type { PendingGuardInstallationDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  isAllowlistPolicy,
  type Policy,
  type PolicySafe,
  type QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { isPolicyGuard } from '@/features/policy-guard/services'

const safeKey = ({ chainId, address }: PolicySafe): string => `${chainId}:${address.toLowerCase()}`

const isBlockingAllowlist = (policy: Policy): boolean =>
  isAllowlistPolicy(policy) && policy.status === 'active' && !!policy.awaitingGuardRemoval

const mapGuardRemoval = (dto: PendingGuardInstallationDto): QueuedAllowlistPolicy | undefined => {
  const removal = dto.changes.find((change) => change.to === null && isPolicyGuard(change.from))
  if (!removal?.from) return undefined

  return {
    id: `${dto.safe.chainId}:${dto.safe.address}:${dto.transaction.safeTxHash}`,
    type: 'allowlist',
    safe: dto.safe,
    enforcement: { via: 'guard', guardAddress: removal.from },
    enabled: true,
    data: { entries: [] },
    status: 'pending',
    operation: 'remove',
    removesGuard: true,
    safeTxHash: dto.transaction.safeTxHash,
    nonce: dto.transaction.nonce,
    confirmationsSubmitted: dto.transaction.confirmations,
    confirmationsRequired: dto.transaction.confirmationsRequired,
    proposedAt: dto.transaction.proposedAt,
  }
}

/** A queued batch that takes the policy guard off a blocking allowlist replaces that row with its own pending one. */
export const mergeGuardRemovals = (
  dtos: readonly PendingGuardInstallationDto[],
  active: readonly Policy[],
): Policy[] => {
  const blocking = new Set(active.filter(isBlockingAllowlist).map((policy) => safeKey(policy.safe)))
  const removals = dtos.flatMap((dto) => {
    const row = mapGuardRemoval(dto)
    return row && blocking.has(safeKey(row.safe)) ? [row] : []
  })
  const removed = new Set(removals.map((row) => safeKey(row.safe)))

  return [
    ...active.filter((policy) => !(isBlockingAllowlist(policy) && removed.has(safeKey(policy.safe)))),
    ...removals,
  ]
}
