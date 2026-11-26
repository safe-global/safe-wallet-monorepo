import type { PendingImmediateGuardPoliciesDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type {
  PolicyTokenInfo,
  QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { isRejectAccess } from '@/features/policy-guard/public/services/rejectAccess'
import { toAllowlistData } from './mapDelayedGuardRequests'

/** A queued guard setup, whose `configureImmediately` binds a first allowlist, as a pending row; other policy kinds are skipped. */
export const mapImmediateGuardPolicies = (
  dto: PendingImmediateGuardPoliciesDto,
  resolveToken: (address: string) => PolicyTokenInfo,
): QueuedAllowlistPolicy | undefined => {
  // The reject rule shares the native transfer's empty selector, but the Safe is not its own recipient
  const configurations = dto.configurations.filter((configuration) => !isRejectAccess(configuration, dto.safe.address))
  const data = toAllowlistData(configurations, resolveToken)
  if (data.entries.length === 0) return undefined

  return {
    id: `${dto.safe.chainId}:${dto.safe.address}:${dto.transaction.safeTxHash}`,
    type: 'allowlist',
    safe: dto.safe,
    enforcement: { via: 'guard', guardAddress: dto.guard },
    enabled: true,
    data,
    status: 'pending',
    operation: 'create',
    appliesOnExecution: true,
    safeTxHash: dto.transaction.safeTxHash,
    nonce: dto.transaction.nonce,
    confirmationsSubmitted: dto.transaction.confirmations,
    confirmationsRequired: dto.transaction.confirmationsRequired,
    proposedAt: dto.transaction.proposedAt,
  }
}
