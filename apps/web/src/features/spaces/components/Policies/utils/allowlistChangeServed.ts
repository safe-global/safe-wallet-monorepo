import { sameAddress } from '@safe-global/utils/utils/addresses'
import {
  isActiveAllowlistPolicy,
  isAllowlistPolicy,
  type PendingAllowlistPolicy,
  type Policy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import type { AllowlistRow } from './allowlistStatus'

const rootOf = (policy: AllowlistRow): string | undefined =>
  policy.status === 'active' ? policy.scheduledChange?.root : policy.root

/** Whether CGW already serves what the executed transaction of `held` changed on its Safe. */
export const isAllowlistChangeServed = (held: PendingAllowlistPolicy, policies: readonly Policy[]): boolean => {
  const rows = policies.filter(
    (policy): policy is AllowlistRow =>
      isAllowlistPolicy(policy) &&
      policy.status !== 'activating' &&
      policy.safe.chainId === held.safe.chainId &&
      sameAddress(policy.safe.address, held.safe.address),
  )

  if (held.appliesOnExecution) return rows.some(isActiveAllowlistPolicy)
  if (held.step === 'remove-guard') return !rows.some((row) => row.status === 'active' && row.awaitingGuardRemoval)
  if (held.step === 'apply') return !rows.some((row) => rootOf(row) === held.root)

  return rows.some((row) => row.status === 'active' && row.scheduledChange?.root === held.root)
}
