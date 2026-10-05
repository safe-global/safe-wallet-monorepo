import {
  CheckEventType,
  type AttestationCandidate,
  type NormalizedCheckEvent,
  type OracleAttestedEvent,
  type OracleProposedEvent,
  type RequestRead,
  type SafenetCheckSnapshot,
} from '../types'
import type { CheckReadResult } from '../services/safenetReader'

/** The Safe a check is being viewed for. Every request and attestation must be bound to it. */
export type CheckTarget = {
  chainId: string
  safeAddress: string
}

/**
 * Whether something naming a Safe's home chain and address belongs to `target`.
 * Chain ids compare exactly, addresses case-insensitively.
 */
export const matchesCheckTarget = (input: { chainId: string; safe: string }, target: CheckTarget): boolean =>
  input.chainId === target.chainId && input.safe.toLowerCase() === target.safeAddress.toLowerCase()

const isConsensusEvent = (event: NormalizedCheckEvent): event is OracleProposedEvent | OracleAttestedEvent =>
  event.type === CheckEventType.ORACLE_PROPOSED || event.type === CheckEventType.ORACLE_ATTESTED

/** Newest attested log first; getter-only evidence (no event) after every dated one. */
const newestFirst = (a: AttestationCandidate, b: AttestationCandidate): number => {
  if (a.event === null || b.event === null) return Number(a.event === null) - Number(b.event === null)
  return b.event.blockNumber - a.event.blockNumber || b.event.logIndex - a.event.logIndex
}

/**
 * Keep only what is bound to `target`.
 *
 * The reader binds logs to a `safeTxHash` alone, and Safe <=1.2.0 leaves the
 * chain id out of its EIP-712 domain, so one hash can carry requests and
 * attestations from two chains. Anything naming another chain or Safe is not
 * this check's evidence: it reads as absent, never as a failure or a verdict.
 *
 * Requests bind by Safe and home chain first. Consensus events bind the same
 * way; Oracle events must reference a retained request. Candidates survive only
 * for a retained request that is `APPROVED`, ordered for verification.
 */
export const bindAttestations = (
  read: CheckReadResult,
  target: CheckTarget,
): { events: NormalizedCheckEvent[]; requests: RequestRead[]; candidates: AttestationCandidate[] } => {
  const requests = read.requests.filter((request) => matchesCheckTarget(request, target))
  const retained = new Set(requests.map((request) => request.requestId))
  const approved = new Set(requests.filter((r) => r.outcome === 'APPROVED').map((request) => request.requestId))

  const events = read.events.filter((event) =>
    isConsensusEvent(event) ? matchesCheckTarget(event, target) : retained.has(event.requestId),
  )
  const candidates = read.candidates
    .filter(({ requestId, event }) => approved.has(requestId) && (event === null || matchesCheckTarget(event, target)))
    .sort(newestFirst)
  return { events, requests, candidates }
}

/**
 * The attested log whose signature produced the snapshot's verdict: the deciding
 * request's own event, and only when it carries the verified signature id.
 * Getter-only evidence has no log, so it returns undefined.
 */
export const verdictAttestation = (snapshot: SafenetCheckSnapshot): OracleAttestedEvent | undefined => {
  const { signatureId } = snapshot.attestation
  if (signatureId === null) return undefined
  const decider = snapshot.requests.find((request) => request.requestId === snapshot.requestId)
  return decider?.attestedEvent?.signatureId === signatureId ? decider.attestedEvent : undefined
}
