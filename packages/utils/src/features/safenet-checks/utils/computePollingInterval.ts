import { LATE_WINDOW_BLOCKS, PLAIN_DEADLINE_BLOCKS, POLL_INTERVAL_FAST_MS, POLL_INTERVAL_LATE_MS } from '../constants'
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
}

/**
 * How often to re-poll a check, in ms; `0` = stop (RTK Query's convention).
 * Stops on a settled verdict; otherwise fast (6s) up to the effective deadline
 * (on-chain, or {@link PLAIN_DEADLINE_BLOCKS} past the first event), slow (30s)
 * through the ~1h late window, then stops.
 */
export const computePollingInterval = ({ status, headBlock, deadlineBlock, firstEventBlock }: PollingInput): number => {
  if (status === CheckStatus.BENIGN || status === CheckStatus.MALICIOUS || status === CheckStatus.VERIFICATION_FAILED) {
    return 0
  }

  // ponytail: UNAVAILABLE stops immediately instead of backing off. Ceiling: a
  // check proposed after this read is not picked up until a manual re-check.
  // Without this, every transaction that never had a check polls forever.
  if (status === CheckStatus.UNAVAILABLE) return 0

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
