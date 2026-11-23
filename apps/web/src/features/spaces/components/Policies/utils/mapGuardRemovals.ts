import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { PendingGuardInstallationDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { isActiveAllowlistPolicy, type Policy } from '@safe-global/views/features/spaces/components/Policies/types'

const clearsSlot = (dto: PendingGuardInstallationDto, kind: PendingGuardInstallationDto['changes'][number]['kind']) =>
  dto.changes.some((change) => change.kind === kind && (change.to === null || sameAddress(change.to, ZERO_ADDRESS)))

/** Whether the queued transaction takes the guard off both slots, as the last step of a removal does. */
const isGuardRemoval = (dto: PendingGuardInstallationDto): boolean =>
  clearsSlot(dto, 'set-guard') && clearsSlot(dto, 'set-module-guard')

/** A queued guard removal shows on the row of the Safe's allowlist, which keeps its id; other guard changes do not. */
export const mergeGuardRemovals = (dtos: readonly PendingGuardInstallationDto[], policies: Policy[]): Policy[] =>
  policies.map((policy) => {
    if (!isActiveAllowlistPolicy(policy)) return policy

    const dto = dtos.find(
      (candidate) =>
        isGuardRemoval(candidate) &&
        candidate.safe.chainId === policy.safe.chainId &&
        sameAddress(candidate.safe.address, policy.safe.address),
    )
    if (!dto) return policy

    return {
      id: policy.id,
      type: 'allowlist',
      safe: policy.safe,
      enforcement: policy.enforcement,
      enabled: policy.enabled,
      data: policy.data,
      status: 'pending',
      operation: 'remove',
      step: 'remove-guard',
      safeTxHash: dto.transaction.safeTxHash,
      nonce: dto.transaction.nonce,
      confirmationsSubmitted: dto.transaction.confirmations,
      confirmationsRequired: dto.transaction.confirmationsRequired,
      proposedAt: dto.transaction.proposedAt,
    }
  })
