import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import type { SafenetCheckSnapshot } from '@safe-global/utils/features/safenet-checks'

export type SafenetDisplayStatus = {
  publicStatus: Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>
  snapshot: SafenetCheckSnapshot
}

/**
 * The check status as every Safenet surface renders it. `null` means render
 * nothing: no check observed, or no snapshot yet — a session-pinned verdict
 * alone never renders, the refetch restores its snapshot within one poll.
 */
export const useSafenetDisplayStatus = (
  safeTxHash: string | undefined,
  timestampMs?: number | null,
): SafenetDisplayStatus | null => {
  const { publicStatus, snapshot } = useSafenetCheck(safeTxHash, timestampMs)

  if (!snapshot || publicStatus === CheckStatus.UNAVAILABLE) return null
  return { publicStatus, snapshot }
}
