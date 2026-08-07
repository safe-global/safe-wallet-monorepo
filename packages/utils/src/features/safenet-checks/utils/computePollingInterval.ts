import { LATE_WINDOW_BLOCKS, PLAIN_DEADLINE_BLOCKS, POLL_INTERVAL_FAST_MS, POLL_INTERVAL_LATE_MS } from '../constants'
import { CheckStatus } from '../types'

export type PollingInput = {
  /**
   * The merged status (after the monotonic pin), not the raw derivation of a
   * single read. A transient empty read derives UNAVAILABLE, and feeding that
   * here would stop polling permanently on a live check.
   */
  status: CheckStatus
  /** Current chain head as a decimal string, or null if unknown. */
  headBlock: string | null
  /** The check's deadline block as a decimal string, or null if unknown. */
  deadlineBlock: string | null
  /**
   * Block of the check's earliest observed event, as a decimal string. It
   * substitutes for the deadline on the plain path, which does not emit one.
   * Without it, a check that is never attested would poll forever.
   *
   * Callers should pass anchors that persist across reads: a transient empty
   * read nulls both anchors while a pinned status keeps the check live, and
   * null anchors fail open to the fast interval.
   */
  firstEventBlock: string | null
}

/**
 * How often to re-poll a check, in ms; `0` = stop (RTK Query's
 * `pollingInterval` convention).
 *
 * Stops permanently on a settled verdict (`BENIGN`, `MALICIOUS`) or terminal
 * `VERIFICATION_FAILED`. Otherwise polls fast (6s) up to and including the
 * effective deadline, which is the on-chain deadline block, or
 * {@link PLAIN_DEADLINE_BLOCKS} past the first observed event when the path has
 * none. After that it polls slowly (30s) through a ~1h late window, so a late
 * `BENIGN`/`MALICIOUS` can still replace a `TIMED_OUT`, and stops once the late
 * window closes. The stop trusts the caller's single head sample. A remount
 * refetches, so an inflated head from a broken endpoint costs one mount's
 * late window and cannot change the verdict.
 */
export const computePollingInterval = ({ status, headBlock, deadlineBlock, firstEventBlock }: PollingInput): number => {
  if (status === CheckStatus.BENIGN || status === CheckStatus.MALICIOUS || status === CheckStatus.VERIFICATION_FAILED) {
    return 0
  }

  // ponytail: UNAVAILABLE stops immediately instead of backing off. Ceiling: a
  // check proposed after this read lands is not picked up until the user hits
  // re-check. Without this, a transaction that never had a check, which is most
  // of them, polls a public RPC every 6s forever, once per rendered row.
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
