import type { Hex } from './events'

/**
 * Full lifecycle status. `AWAITING_VERIFICATION` and `VERIFICATION_FAILED` are
 * internal-only — {@link toPublicStatus} folds them into the public set, and
 * `VERIFICATION_FAILED` never becomes `BENIGN`.
 */
export enum CheckStatus {
  /** Proposed onchain, no oracle activity yet. */
  SUBMITTED = 'SUBMITTED',
  /** Oracle request opened / sentinels active, pre-deadline, no verdict. */
  IN_PROGRESS = 'IN_PROGRESS',
  /** Attested onchain but the FROST signature has not been verified yet. */
  AWAITING_VERIFICATION = 'AWAITING_VERIFICATION',
  /** Attested, but the FROST signature failed verification (terminal). */
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  /** Attested AND cryptographically verified. The only green state. */
  BENIGN = 'BENIGN',
  /** A negative verdict was observed (rejected / disapproved). */
  MALICIOUS = 'MALICIOUS',
  /** Deadline passed without a resolving verdict (includes frozen disputes). */
  TIMED_OUT = 'TIMED_OUT',
  /** The reader could not determine state (RPC/config failure). */
  UNAVAILABLE = 'UNAVAILABLE',
}

/** The status values that may be shown to a user. */
export type PublicCheckStatus =
  | CheckStatus.SUBMITTED
  | CheckStatus.IN_PROGRESS
  | CheckStatus.BENIGN
  | CheckStatus.MALICIOUS
  | CheckStatus.TIMED_OUT
  | CheckStatus.UNAVAILABLE

/**
 * Map an internal status to its public projection: `AWAITING_VERIFICATION`
 * reads as still-working, `VERIFICATION_FAILED` as `TIMED_OUT` — an attestation
 * that cannot be trusted is not-completed, never safe.
 */
export const toPublicStatus = (status: CheckStatus): PublicCheckStatus => {
  switch (status) {
    case CheckStatus.AWAITING_VERIFICATION:
      return CheckStatus.IN_PROGRESS
    case CheckStatus.VERIFICATION_FAILED:
      return CheckStatus.TIMED_OUT
    default:
      return status
  }
}

/** Result of verifying an attestation's FROST signature. */
export enum AttestationVerificationStatus {
  /** No attestation present, or verification not yet attempted. */
  UNVERIFIED = 'UNVERIFIED',
  /** Group key not yet available — retryable, not terminal. */
  PENDING = 'PENDING',
  /** Signature verified against the epoch group key. */
  VERIFIED = 'VERIFIED',
  /** Signature did not verify — terminal, must never render as BENIGN. */
  INVALID = 'INVALID',
}

export type AttestationVerification = {
  status: AttestationVerificationStatus
  /** The attestation's signature id, when one exists. */
  signatureId: Hex | null
  /** The oracle-proposal hash (a.k.a. requestId) that was verified. */
  message: Hex | null
}

export const UNVERIFIED_ATTESTATION: AttestationVerification = {
  status: AttestationVerificationStatus.UNVERIFIED,
  signatureId: null,
  message: null,
}
