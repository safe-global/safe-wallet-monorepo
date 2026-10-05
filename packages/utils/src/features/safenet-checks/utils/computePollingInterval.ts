import {
  ARBITRATION_POLL_MS,
  LATE_WINDOW_BLOCKS,
  POLL_INTERVAL_FAST_MS,
  POLL_INTERVAL_LATE_MS,
  UNAVAILABLE_GRACE_MS,
  UNAVAILABLE_GRACE_POLL_MS,
} from '../constants'
import { AttestationVerificationStatus, type RequestSnapshot } from '../types'

type PollingInput = {
  /** Every target-bound request of the check. The cadence follows their actual states. */
  requests: ReadonlyArray<RequestSnapshot>
  headBlock: string | null
  /**
   * Transaction submission time, the anchor of the grace window for a read that
   * found no request. `null` or absent disables the window.
   */
  submittedAtMs?: number | null
  /** Caller's clock for this computation. Keeps the function pure. */
  nowMs?: number
}

/** Fast up to and including `until`, slow after. An unknown head counts as before. */
const fastUntil = (head: bigint | null, until: bigint): number =>
  head === null || head <= until ? POLL_INTERVAL_FAST_MS : POLL_INTERVAL_LATE_MS

const isAwaitingAttestation = ({ outcome, attestation }: RequestSnapshot): boolean =>
  outcome === 'APPROVED' &&
  (attestation.status === AttestationVerificationStatus.UNVERIFIED ||
    attestation.status === AttestationVerificationStatus.PENDING)

/** One request's cadence in ms; 0 when nothing about it can still change. */
const requestInterval = (request: RequestSnapshot, head: bigint | null): number => {
  const revealDeadline = BigInt(request.revealDeadlineBlock)
  if (request.outcome === 'DISPUTED') return ARBITRATION_POLL_MS
  if (request.outcome === 'PENDING') return fastUntil(head, revealDeadline)
  if (isAwaitingAttestation(request)) return fastUntil(head, revealDeadline + BigInt(LATE_WINDOW_BLOCKS))
  return 0
}

/**
 * How often to re-poll a check, in ms; `0` = stop (RTK Query's convention). The
 * fastest cadence any request needs wins:
 *
 *  - a pending request polls fast through its reveal deadline, then slowly;
 *  - an approved request awaiting its attestation or group key polls fast through
 *    the reveal deadline plus {@link LATE_WINDOW_BLOCKS}, then slowly;
 *  - a disputed request polls every {@link ARBITRATION_POLL_MS}, past its
 *    arbitration deadline too, since the contract keeps it frozen until ruled;
 *  - settled requests stop. No elapsed time ends an open request: the contract
 *    has no timeout for them here.
 *
 * A read that found no request polls slowly inside {@link UNAVAILABLE_GRACE_MS}
 * of the submission, which covers the first read landing before the request mines.
 */
export const computePollingInterval = ({ requests, headBlock, submittedAtMs, nowMs }: PollingInput): number => {
  if (requests.length === 0) {
    if (submittedAtMs == null || nowMs === undefined) return 0
    // A submission stamped in the future is clock skew, not a young check:
    // without the lower bound the window would stretch by the whole skew.
    const age = nowMs - submittedAtMs
    return age >= 0 && age < UNAVAILABLE_GRACE_MS ? UNAVAILABLE_GRACE_POLL_MS : 0
  }

  const head = headBlock === null ? null : BigInt(headBlock)
  const intervals = requests.map((request) => requestInterval(request, head)).filter((interval) => interval > 0)
  return intervals.length > 0 ? Math.min(...intervals) : 0
}
