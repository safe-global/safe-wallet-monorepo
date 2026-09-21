import { CheckStatus } from '../types'

/**
 * Allowed replacements per pinned status — the "never take back a verdict"
 * layer on top of the recompute-from-scratch derivation. `MALICIOUS` is
 * terminal; `BENIGN` yields only to `MALICIOUS` (a late arbitration result is
 * the one correction that increases safety); `BENIGN`/`MALICIOUS` may replace
 * `TIMED_OUT`; `VERIFICATION_FAILED` may become `MALICIOUS` but never `BENIGN`.
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

/** Merge a freshly-derived status onto the pinned one (null = first observation). */
export const mergeMonotonic = (pinned: CheckStatus | null | undefined, next: CheckStatus): CheckStatus => {
  if (pinned == null) return next
  if (pinned === next) return pinned
  // A transient fetch failure must never clobber a known status.
  if (next === CheckStatus.UNAVAILABLE) return pinned
  return ALLOWED_TRANSITIONS[pinned].includes(next) ? next : pinned
}
