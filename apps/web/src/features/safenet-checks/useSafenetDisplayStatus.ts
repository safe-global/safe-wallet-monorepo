import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import type { SafenetCheckSnapshot } from '@safe-global/utils/features/safenet-checks'

export type SafenetDisplayStatus = {
  /** UNAVAILABLE means render nothing — no check observed (or snapshot not yet loaded). */
  publicStatus: PublicCheckStatus
  snapshot: SafenetCheckSnapshot | undefined
}

/**
 * The check status as every Safenet surface renders it: without a snapshot the
 * status collapses to UNAVAILABLE — a session-pinned verdict alone never
 * renders, the refetch restores its snapshot within one poll.
 */
export const useSafenetDisplayStatus = (
  safeTxHash: string | undefined,
  timestampMs?: number | null,
): SafenetDisplayStatus => {
  const { publicStatus, snapshot } = useSafenetCheck(safeTxHash, timestampMs)

  if (!snapshot) return { publicStatus: CheckStatus.UNAVAILABLE, snapshot: undefined }
  return { publicStatus, snapshot }
}
