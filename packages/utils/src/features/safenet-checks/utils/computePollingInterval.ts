import { LATE_WINDOW_BLOCKS, POLL_INTERVAL_FAST_MS, POLL_INTERVAL_LATE_MS } from '../constants'
import { CheckStatus } from '../types'

export type PollingInput = {
  status: CheckStatus
  /** Current chain head as a decimal string, or null if unknown. */
  headBlock: string | null
  /** The check's deadline block as a decimal string, or null if unknown. */
  deadlineBlock: string | null
}

export type PollingDecision = {
  shouldPoll: boolean
  /** Interval in ms; 0 when polling has stopped. */
  intervalMs: number
}

const STOP: PollingDecision = { shouldPoll: false, intervalMs: 0 }

/**
 * Decide whether and how often to re-poll a check.
 *
 * Stops permanently on a settled verdict (`BENIGN`, `MALICIOUS`) or terminal
 * `VERIFICATION_FAILED`. Otherwise polls fast (6s) up to and including the
 * deadline block, then slowly (30s) through a ~1h late window so a late
 * `BENIGN`/`MALICIOUS` can still replace a `TIMED_OUT`, and finally stops once
 * the late window closes.
 */
export const computePollingInterval = ({ status, headBlock, deadlineBlock }: PollingInput): PollingDecision => {
  if (status === CheckStatus.BENIGN || status === CheckStatus.MALICIOUS || status === CheckStatus.VERIFICATION_FAILED) {
    return STOP
  }

  // ponytail: UNAVAILABLE stops immediately rather than backing off. Ceiling —
  // a check proposed after this read lands is not picked up until the user hits
  // re-check. Without this a transaction that never had a check (most of them)
  // polls a public RPC every 6s forever, once per rendered row.
  if (status === CheckStatus.UNAVAILABLE) return STOP

  const head = headBlock !== null ? BigInt(headBlock) : null
  const deadline = deadlineBlock !== null ? BigInt(deadlineBlock) : null

  if (deadline === null || head === null || head <= deadline) {
    return { shouldPoll: true, intervalMs: POLL_INTERVAL_FAST_MS }
  }

  const lateWindowEnd = deadline + BigInt(LATE_WINDOW_BLOCKS)
  if (head <= lateWindowEnd) {
    return { shouldPoll: true, intervalMs: POLL_INTERVAL_LATE_MS }
  }

  return STOP
}
