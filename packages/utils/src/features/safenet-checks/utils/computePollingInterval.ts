import {
  ARBITRATION_POLL_MS,
  ARBITRATION_WINDOW_MS,
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
  /**
   * When the attestation landed, the anchor of the BENIGN arbitration window.
   * `null` or absent disables the window.
   */
  attestedAtMs?: number | null
  /** Caller's clock for this computation. Keeps the function pure. */
  nowMs?: number
}

/**
 * How often to re-poll a check, in ms; `0` = stop (RTK Query's convention).
 * Stops on a rejection; otherwise fast (6s) up to the effective deadline
 * (on-chain, or {@link PLAIN_DEADLINE_BLOCKS} past the first event), slow (30s)
 * through the ~1h late window, then stops. UNAVAILABLE polls slowly inside
 * {@link UNAVAILABLE_GRACE_MS} of submission and BENIGN inside
 * {@link ARBITRATION_WINDOW_MS} of the attestation, then both stop.
 */
export const computePollingInterval = ({
  status,
  headBlock,
  deadlineBlock,
  firstEventBlock,
  submittedAtMs,
  attestedAtMs,
  nowMs,
}: PollingInput): number => {
  if (status === CheckStatus.MALICIOUS || status === CheckStatus.VERIFICATION_FAILED) return 0

  // ponytail: BENIGN keeps a slow poll for the arbitration window. The merge
  // permits BENIGN → MALICIOUS precisely because arbitration can still reject a
  // check, and that correction is unobservable if polling stops at the verdict.
  // Ceiling: the window length is a guess, so an arbitration landing later than
  // it is still only picked up by a page reload.
  if (status === CheckStatus.BENIGN) {
    if (attestedAtMs == null || nowMs === undefined) return 0
    const age = nowMs - attestedAtMs
    return age >= 0 && age < ARBITRATION_WINDOW_MS ? ARBITRATION_POLL_MS : 0
  }

  // ponytail: UNAVAILABLE backs off only for the grace window, so a check
  // requested around the first read still self-heals. Ceiling: past the window
  // a later check is only picked up by a page reload, or by a fresh mount after
  // the five-minute cache retention lapses — there is no re-check control in
  // the UI. (Re-aiming the shared read is a third path in principle, but every
  // shipped surface offers the same submission date, so it cannot fire today.)
  // Polling on past the window would put every check-less transaction on a
  // public RPC forever.
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
