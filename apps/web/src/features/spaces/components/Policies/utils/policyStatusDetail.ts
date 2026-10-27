import { formatSignedCount } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/format'
import { formatAppliesAt } from '@safe-global/views/features/spaces/components/Policies/utils/policyStatusDetail'
import { isActiveAllowlistPolicy, type Policy } from '@safe-global/views/features/spaces/components/Policies/types'

/** Tells the pending states apart: signatures still missing, ready to execute, or waiting out the delay. */
export const getPendingStatusDetail = (policy: Policy, nowMs = Date.now()): string | undefined => {
  if (isActiveAllowlistPolicy(policy) && policy.scheduledChange) {
    return formatAppliesAt(policy.scheduledChange.appliesAt, nowMs)
  }
  if (policy.status === 'failed') return 'The transaction failed. Nothing changed on this account.'
  if (policy.status !== 'pending') return undefined

  const { confirmationsSubmitted, confirmationsRequired } = policy

  return confirmationsSubmitted >= confirmationsRequired
    ? 'Ready to execute'
    : formatSignedCount(confirmationsSubmitted, confirmationsRequired)
}
