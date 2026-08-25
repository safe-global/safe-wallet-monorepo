import {
  LATE_WINDOW_BLOCKS,
  PLAIN_DEADLINE_BLOCKS,
  POLL_INTERVAL_FAST_MS,
  POLL_INTERVAL_LATE_MS,
  UNAVAILABLE_GRACE_MS,
  UNAVAILABLE_GRACE_POLL_MS,
} from '../constants'
import { CheckStatus } from '../types'

type PollingInput = {
  /**
   * The merged status (after the monotonic pin), not a single read's raw
   * derivation — a transient UNAVAILABLE would stop polling a live check.
   */
  status: CheckStatus
  headBlock: string | null
  deadlineBlock: string | null
  /**
   * Block of the check's earliest observed event; substitutes for the deadline
   * on the plain path. Callers should pass anchors that persist across reads —
   * null anchors fail open to the fast interval.
   */
  firstEventBlock: string | null
  /**
   * Transaction submission time, the anchor of the UNAVAILABLE grace window.
   * `null` or absent disables the window.
   */
  submittedAtMs?: number | null
  /** Caller's clock for this computation. Keeps the function pure. */
  nowMs?: number
}

/**
 * How often to re-poll a check, in ms; `0` = stop (RTK Query's convention).
 * Stops on a settled verdict; otherwise fast (6s) up to the effective deadline
 * (on-chain, or {@link PLAIN_DEADLINE_BLOCKS} past the first event), slow (30s)
 * through the ~1h late window, then stops. UNAVAILABLE polls slowly inside
 * {@link UNAVAILABLE_GRACE_MS} of submission, then stops.
 */
export const computePollingInterval = ({
  status,
  headBlock,
  deadlineBlock,
  firstEventBlock,
  submittedAtMs,
  nowMs,
}: PollingInput): number => {
  if (status === CheckStatus.BENIGN || status === CheckStatus.MALICIOUS || status === CheckStatus.VERIFICATION_FAILED) {
    return 0
  }

  // ponytail: UNAVAILABLE backs off only for the grace window, so a check
  // requested around the first read still self-heals. Ceiling: past the window
  // a later check is not picked up until a manual re-check. Polling on past
  // the window would put every check-less transaction on a public RPC forever.
  if (status === CheckStatus.UNAVAILABLE) {
    if (submittedAtMs == null || nowMs === undefined) return 0
    // A submission stamped in the future is clock skew, not a young check:
    // without the lower bound the window would stretch by the whole skew.
    const age = nowMs - submittedAtMs
    return age >= 0 && age < UNAVAILABLE_GRACE_MS ? UNAVAILABLE_GRACE_POLL_MS : 0
  }

  const head = headBlock !== null ? BigInt(headBlock) : null
  const deadline =
    deadlineBlock !== null
      ? BigInt(deadlineBlock)
      : firstEventBlock !== null
        ? BigInt(firstEventBlock) + BigInt(PLAIN_DEADLINE_BLOCKS)
        : null

  if (deadline === null || head === null || head <= deadline) return POLL_INTERVAL_FAST_MS
  if (head <= deadline + BigInt(LATE_WINDOW_BLOCKS)) return POLL_INTERVAL_LATE_MS
  return 0
}
