import {
  AttestationVerificationStatus,
  CheckEventType,
  CheckStatus,
  type AttestationVerification,
  type NormalizedCheckEvent,
} from '../types'

type DeriveCheckStateInput = {
  /** All decoded events for one check (order-independent; derive is a fold). */
  events: ReadonlyArray<NormalizedCheckEvent>
  /** FROST verification result for the attestation, if any. */
  attestation: AttestationVerification
  /** Current chain head as a decimal string, or null if unknown. */
  headBlock: string | null
}

/** Highest deadline block across the check's request events, or null. Shared with the reader. */
export const deadlineBlockOf = (events: ReadonlyArray<NormalizedCheckEvent>): bigint | null => {
  let deadline: bigint | null = null
  for (const event of events) {
    if (event.type === CheckEventType.REQUEST_CREATED) {
      const value = BigInt(event.deadlineBlock)
      if (deadline === null || value > deadline) deadline = value
    }
  }
  return deadline
}

/**
 * True if the oracle has SETTLED on a rejection. Only `OracleResult` counts: a
 * single sentinel's `Committed`/`Revealed` is one bonded vote, not a verdict —
 * a split goes to arbitration, which can still approve, and arbitrated
 * rejections re-emit `OracleResult` alongside `DisputeResolved`.
 */
const hasNegativeVerdict = (events: ReadonlyArray<NormalizedCheckEvent>): boolean =>
  events.some((event) => event.type === CheckEventType.ORACLE_RESULT && event.approved === false)

const hasAnyProposal = (events: ReadonlyArray<NormalizedCheckEvent>): boolean =>
  events.some((event) => event.type === CheckEventType.ORACLE_PROPOSED || event.type === CheckEventType.PLAIN_PROPOSED)

const hasOracleActivity = (events: ReadonlyArray<NormalizedCheckEvent>): boolean =>
  events.some(
    (event) =>
      event.type === CheckEventType.REQUEST_CREATED ||
      event.type === CheckEventType.SENTINEL_COMMITTED ||
      event.type === CheckEventType.SENTINEL_REVEALED ||
      event.type === CheckEventType.ORACLE_RESULT ||
      event.type === CheckEventType.DISPUTE_RESOLVED,
  )

/**
 * Derive the check status from its full event set. Recomputed from scratch each
 * poll (idempotent, reorg-self-healing). Precedence, highest first:
 *
 *  1. Negative verdict → `MALICIOUS` (even late, even past deadline).
 *  2. Attested → `BENIGN` only if the FROST signature verified,
 *     `VERIFICATION_FAILED` if it did not, else `AWAITING_VERIFICATION`.
 *     Above the deadline check so a late attestation beats `TIMED_OUT`.
 *  3. Past the deadline block → `TIMED_OUT` (incl. frozen disputes).
 *  4. Any oracle activity → `IN_PROGRESS` (a positive `OracleResult` alone is
 *     NOT `BENIGN` without a verified attestation).
 *  5. Otherwise → `SUBMITTED`, requiring an actual proposal event.
 */
export const deriveCheckState = ({ events, attestation, headBlock }: DeriveCheckStateInput): CheckStatus => {
  if (hasNegativeVerdict(events)) return CheckStatus.MALICIOUS

  // No proposal-event gate on the attested branches: an attestation is
  // self-authenticating, and a targeted window can clip the proposal.
  const attested = events.some((event) => event.type === CheckEventType.ORACLE_ATTESTED)
  if (attested) {
    if (attestation.status === AttestationVerificationStatus.VERIFIED) return CheckStatus.BENIGN
    if (attestation.status === AttestationVerificationStatus.INVALID) return CheckStatus.VERIFICATION_FAILED
    return CheckStatus.AWAITING_VERIFICATION
  }

  // Non-oracle path: the validator set's own checks passed — BENIGN, but only
  // on a verified signature, exactly like the oracle path.
  const plainAttested = events.some((event) => event.type === CheckEventType.PLAIN_ATTESTED)
  if (plainAttested) {
    if (attestation.status === AttestationVerificationStatus.VERIFIED) return CheckStatus.BENIGN
    if (attestation.status === AttestationVerificationStatus.INVALID) return CheckStatus.VERIFICATION_FAILED
    return CheckStatus.AWAITING_VERIFICATION
  }

  const deadline = deadlineBlockOf(events)
  if (deadline !== null && headBlock !== null && BigInt(headBlock) > deadline) {
    return CheckStatus.TIMED_OUT
  }

  if (hasOracleActivity(events)) return CheckStatus.IN_PROGRESS

  if (hasAnyProposal(events)) return CheckStatus.SUBMITTED

  return CheckStatus.UNAVAILABLE
}
