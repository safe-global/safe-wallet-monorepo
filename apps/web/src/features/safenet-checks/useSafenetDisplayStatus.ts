import {
  CheckStatus,
  type PublicCheckStatus,
  type SafenetCheckSnapshot,
  type UnavailableReason,
} from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import useSafeInfo from '@/hooks/useSafeInfo'

/**
 * The only UNAVAILABLE reason a surface shows. NO_CHECK and WINDOW_UNCERTAIN stay hidden: most
 * transactions have no check, and the read window of an old one is only heuristic.
 */
export type ShownUnavailableReason = Extract<UnavailableReason, 'READ_FAILED'>

export type SafenetDisplayStatus =
  | { publicStatus: Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>; snapshot: SafenetCheckSnapshot }
  | { publicStatus: CheckStatus.UNAVAILABLE; unavailableReason: ShownUnavailableReason }

/**
 * The check status as every Safenet surface renders it. `null` means render
 * nothing: no check observed, the first read still in flight, or no snapshot
 * for a verdict — a session-pinned verdict alone never renders, the refetch
 * restores its snapshot within one poll.
 */
export const useSafenetDisplayStatus = (
  safeTxHash: string | undefined,
  timestampMs?: number | null,
): SafenetDisplayStatus | null => {
  const { safe, safeAddress } = useSafeInfo()
  const { publicStatus, snapshot, unavailableReason } = useSafenetCheck(safeTxHash, timestampMs, {
    chainId: safe.chainId,
    safeAddress,
  })

  if (publicStatus === CheckStatus.UNAVAILABLE) {
    return unavailableReason === 'READ_FAILED' ? { publicStatus, unavailableReason } : null
  }
  return snapshot ? { publicStatus, snapshot } : null
}
