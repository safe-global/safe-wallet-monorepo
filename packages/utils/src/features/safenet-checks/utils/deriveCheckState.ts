import {
  AttestationVerificationStatus,
  CheckEventType,
  CheckStatus,
  type AttestationVerification,
  type Hex,
  type NormalizedCheckEvent,
  type RequestOutcome,
  type RequestSnapshot,
} from '../types'
import { comparePositions, lexical } from './requestOutcome'

type DerivePlainCheckStateInput = {
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
 * Derive the check status from the events of a read with no request. Recomputed from scratch each
 * poll, so the derivation itself is idempotent and follows a reorg in both
 * directions. The merged value does not: `mergeMonotonic` only advances, so a
 * reorg below the deadline leaves a pinned `TIMED_OUT` in place.
 * Precedence, highest first:
 *
 *  1. Negative verdict → `MALICIOUS` (even late, even past deadline).
 *  2. Attested → `BENIGN` only if the FROST signature verified,
 *     `VERIFICATION_FAILED` if it did not, else `AWAITING_VERIFICATION`.
 *     Above the deadline check so a late attestation beats `TIMED_OUT`.
 *  3. Past the deadline block → `TIMED_OUT` (incl. frozen disputes).
 *  4. Any oracle activity → `IN_PROGRESS` (a positive `OracleResult` alone is
 *     NOT `BENIGN` without a verified attestation).
 *  5. Any proposal event → `SUBMITTED`.
 *  6. Otherwise → `UNAVAILABLE`: no event of this check was read at all, which
 *     is also what a read over too narrow a block window produces.
 */
export const derivePlainCheckState = ({ events, attestation, headBlock }: DerivePlainCheckStateInput): CheckStatus => {
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

type DeriveCheckStateInput = {
  /** Every target-bound request of one check, each with its own verification. */
  requests: ReadonlyArray<RequestSnapshot>
}

export type DerivedCheckState = {
  status: CheckStatus
  /** The deciding request; every request-scoped snapshot field belongs to it. */
  requestId: Hex | null
  outcome: RequestOutcome | null
}

type Compare = (a: RequestSnapshot, b: RequestSnapshot) => number

const earliestProposal: Compare = (a, b) =>
  comparePositions(a.proposedAt, b.proposedAt, 1) || lexical(a.requestId, b.requestId)

const latestProposal: Compare = (a, b) =>
  comparePositions(a.proposedAt, b.proposedAt, -1) || lexical(a.requestId, b.requestId)

const newestAttestation: Compare = (a, b) =>
  comparePositions(a.attestedEvent, b.attestedEvent, -1) || lexical(a.requestId, b.requestId)

const pick = (requests: ReadonlyArray<RequestSnapshot>, compare: Compare): RequestSnapshot | null =>
  [...requests].sort(compare)[0] ?? null

const isRisk = ({ outcome }: RequestSnapshot): boolean => outcome === 'DENIED' || outcome === 'RULED_INSECURE'

const isVerifiedApproval = ({ outcome, attestation }: RequestSnapshot): boolean =>
  outcome === 'APPROVED' && attestation.status === AttestationVerificationStatus.VERIFIED

const approvedStatus = ({ attestation }: RequestSnapshot): CheckStatus => {
  if (attestation.status === AttestationVerificationStatus.PENDING) return CheckStatus.AWAITING_VERIFICATION
  if (attestation.status === AttestationVerificationStatus.INVALID) return CheckStatus.VERIFICATION_FAILED
  return CheckStatus.IN_PROGRESS
}

/** The coarse status of a request that no earlier precedence rank claimed. */
const REMAINING_STATUS: Record<RequestOutcome, (request: RequestSnapshot) => CheckStatus> = {
  PENDING: ({ committedCount }) => (committedCount > 0 ? CheckStatus.IN_PROGRESS : CheckStatus.SUBMITTED),
  APPROVED: approvedStatus,
  DENIED: () => CheckStatus.MALICIOUS,
  DISPUTED: () => CheckStatus.IN_PROGRESS,
  RULED_SECURE: () => CheckStatus.UNAVAILABLE,
  RULED_INSECURE: () => CheckStatus.MALICIOUS,
  NO_RULING: () => CheckStatus.UNAVAILABLE,
  TIMED_OUT: () => CheckStatus.TIMED_OUT,
}

const decided = (request: RequestSnapshot, status: CheckStatus): DerivedCheckState => ({
  status,
  requestId: request.requestId,
  outcome: request.outcome,
})

/**
 * Select the deciding request and derive the check's status from it. The
 * snapshot's request-scoped fields all come from this one selection. A request
 * never inherits a sibling's verification. Precedence, highest first:
 *
 *  1. A denial or a Council "insecure" ruling → `MALICIOUS` (earliest proposal).
 *  2. An open dispute → `IN_PROGRESS` with outcome `DISPUTED`. It outranks a
 *     verified sibling; execution is outside the reader and stays available.
 *  3. An approved request with a VERIFIED attestation → `BENIGN` (newest evidence).
 *  4. The latest remaining request: pending, awaiting or failing verification,
 *     a ruling without an attestation, or a timeout.
 *  5. No request → `UNAVAILABLE`.
 *
 * No elapsed deadline creates an outcome: only the contract's state does.
 */
export const deriveCheckState = ({ requests }: DeriveCheckStateInput): DerivedCheckState => {
  const risk = pick(requests.filter(isRisk), earliestProposal)
  if (risk) return decided(risk, CheckStatus.MALICIOUS)

  const disputed = pick(
    requests.filter((request) => request.outcome === 'DISPUTED'),
    earliestProposal,
  )
  if (disputed) return decided(disputed, CheckStatus.IN_PROGRESS)

  const verified = pick(requests.filter(isVerifiedApproval), newestAttestation)
  if (verified) return decided(verified, CheckStatus.BENIGN)

  const latest = pick(requests, latestProposal)
  if (!latest) return { status: CheckStatus.UNAVAILABLE, requestId: null, outcome: null }
  return decided(latest, REMAINING_STATUS[latest.outcome](latest))
}
