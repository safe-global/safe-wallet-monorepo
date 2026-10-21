import { formatSignedCount } from '../SpendingLimitDrawer/format'
import type { Policy } from '../types'

/** Tells the two pending states apart: signatures still missing, or ready to execute. */
export const getPendingStatusDetail = (policy: Policy): string | undefined => {
  if (policy.status !== 'pending') return undefined

  const { confirmationsSubmitted, confirmationsRequired } = policy

  return confirmationsSubmitted >= confirmationsRequired
    ? 'Ready to execute'
    : formatSignedCount(confirmationsSubmitted, confirmationsRequired)
}
