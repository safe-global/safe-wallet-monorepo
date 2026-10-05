import {
  AttestationVerificationStatus,
  CheckStatus,
  type Hex,
  type RequestOutcome,
  type RequestSnapshot,
} from '../types'
import { comparePositions, lexical } from './requestOutcome'

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
