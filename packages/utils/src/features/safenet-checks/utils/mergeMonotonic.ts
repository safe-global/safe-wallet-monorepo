import { CheckStatus } from '../types'

/**
 * Monotonic merge — the "never take back a verdict" layer, applied on top of the
 * recompute-from-scratch status so a poll (or a reorg) can't visibly walk a
 * verdict backwards.
 *
 * For each already-pinned status, the table lists which incoming statuses are
 * allowed to replace it; anything else keeps the pinned status. Highlights:
 *  - `MALICIOUS` is terminal. `BENIGN` is terminal except for `MALICIOUS`: a
 *    late arbitration result is the one correction that increases safety, so it
 *    is the only transition allowed to override a shown verdict.
 *  - A late `BENIGN` or `MALICIOUS` may replace `TIMED_OUT` (the two allowed
 *    late upgrades).
 *  - `VERIFICATION_FAILED` may become `MALICIOUS` but never `BENIGN`.
 *  - A transient `UNAVAILABLE` never overwrites a known status.
 */
const ALLOWED_TRANSITIONS: Record<CheckStatus, ReadonlyArray<CheckStatus>> = {
  [CheckStatus.UNAVAILABLE]: [
    CheckStatus.SUBMITTED,
    CheckStatus.IN_PROGRESS,
    CheckStatus.AWAITING_VERIFICATION,
    CheckStatus.TIMED_OUT,
    CheckStatus.VERIFICATION_FAILED,
    CheckStatus.BENIGN,
    CheckStatus.MALICIOUS,
  ],
  [CheckStatus.SUBMITTED]: [
    CheckStatus.IN_PROGRESS,
    CheckStatus.AWAITING_VERIFICATION,
    CheckStatus.TIMED_OUT,
    CheckStatus.VERIFICATION_FAILED,
    CheckStatus.BENIGN,
    CheckStatus.MALICIOUS,
  ],
  [CheckStatus.IN_PROGRESS]: [
    CheckStatus.AWAITING_VERIFICATION,
    CheckStatus.TIMED_OUT,
    CheckStatus.VERIFICATION_FAILED,
    CheckStatus.BENIGN,
    CheckStatus.MALICIOUS,
  ],
  [CheckStatus.AWAITING_VERIFICATION]: [
    CheckStatus.TIMED_OUT,
    CheckStatus.VERIFICATION_FAILED,
    CheckStatus.BENIGN,
    CheckStatus.MALICIOUS,
  ],
  [CheckStatus.TIMED_OUT]: [CheckStatus.VERIFICATION_FAILED, CheckStatus.BENIGN, CheckStatus.MALICIOUS],
  [CheckStatus.VERIFICATION_FAILED]: [CheckStatus.MALICIOUS],
  [CheckStatus.BENIGN]: [CheckStatus.MALICIOUS],
  [CheckStatus.MALICIOUS]: [],
}

/**
 * Merge a freshly-derived status onto the pinned one.
 *
 * @param pinned - the previously-committed status, or null on first observation
 * @param next - the status just derived from the current event set
 * @returns the status to show/persist
 */
export const mergeMonotonic = (pinned: CheckStatus | null | undefined, next: CheckStatus): CheckStatus => {
  if (pinned == null) return next
  if (pinned === next) return pinned
  // A transient fetch failure must never clobber a known status.
  if (next === CheckStatus.UNAVAILABLE) return pinned
  return ALLOWED_TRANSITIONS[pinned].includes(next) ? next : pinned
}
