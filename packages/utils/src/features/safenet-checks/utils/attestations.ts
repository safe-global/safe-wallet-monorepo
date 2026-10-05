import { CheckEventType, type AttestedCheckEvent, type NormalizedCheckEvent } from '../types'
import type { SafenetCheckSnapshot } from '../types/snapshot'

const isAttested = (event: NormalizedCheckEvent): event is AttestedCheckEvent =>
  event.type === CheckEventType.ORACLE_ATTESTED || event.type === CheckEventType.PLAIN_ATTESTED

// The oracle family outranks the plain one because deriveCheckState reads the
// oracle branch first: verifying a plain event while an oracle one exists would
// answer a question the status machine never asks.
const familyRank = (event: AttestedCheckEvent): number => (event.type === CheckEventType.ORACLE_ATTESTED ? 1 : 0)

/**
 * A check's attested events in verification order: oracle family first, newest
 * first inside each family. Newest first because a cross-epoch re-proposal is
 * the protocol's only retry — verifying the earliest event lets one invalid
 * attestation terminalize a check that a later valid one settles.
 */
const attestationCandidates = (events: ReadonlyArray<NormalizedCheckEvent>): AttestedCheckEvent[] =>
  events
    .filter(isAttested)
    .sort((a, b) => familyRank(b) - familyRank(a) || b.blockNumber - a.blockNumber || b.logIndex - a.logIndex)

/** The Safe a check is being viewed for. An attestation must be bound to it. */
export type CheckTarget = {
  chainId: string
  safeAddress: string
}

/** Whether something naming a Safe's home chain and address belongs to `target`: exact chain id, any address case. */
export const matchesCheckTarget = (input: { chainId: string; safe: string }, target: CheckTarget): boolean =>
  input.chainId === target.chainId && input.safe.toLowerCase() === target.safeAddress.toLowerCase()

/**
 * Drop the attested events that are not bound to `target`, and order what
 * remains for verification.
 *
 * The reader binds logs to a `safeTxHash` alone, and Safe <=1.2.0 leaves the
 * chain id out of its EIP-712 domain, so one hash can carry attestations from
 * two chains. An attestation naming another chain or Safe is not this check's
 * evidence and must read as no attestation at all — never as a failure, and
 * never as a verdict.
 */
export const bindAttestations = (
  events: ReadonlyArray<NormalizedCheckEvent>,
  target: CheckTarget,
): { events: NormalizedCheckEvent[]; candidates: AttestedCheckEvent[] } => {
  const bound = events.filter((event) => !isAttested(event) || matchesCheckTarget(event, target))
  return { events: bound, candidates: attestationCandidates(bound) }
}

/**
 * The attested event whose signature produced the snapshot's verdict. With
 * requests it is the deciding request's own event, and only when that event
 * carries the verified signature id. Without, selection skips attestations
 * that do not verify, so it is the event matching the verified signature id —
 * not simply the first attestation read.
 */
export const verdictAttestation = (snapshot: SafenetCheckSnapshot): AttestedCheckEvent | undefined => {
  const { signatureId } = snapshot.attestation
  if (signatureId === null) return undefined
  if (snapshot.requests.length > 0) {
    const decider = snapshot.requests.find((request) => request.requestId === snapshot.requestId)
    return decider?.attestedEvent?.signatureId === signatureId ? decider.attestedEvent : undefined
  }
  return attestationCandidates(snapshot.events).find((event) => event.signatureId === signatureId)
}
