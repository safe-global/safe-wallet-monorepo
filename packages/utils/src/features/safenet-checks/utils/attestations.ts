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
  const safeAddress = target.safeAddress.toLowerCase()
  const bound = events.filter(
    (event) => !isAttested(event) || (event.chainId === target.chainId && event.safe.toLowerCase() === safeAddress),
  )
  return { events: bound, candidates: attestationCandidates(bound) }
}

/**
 * The attested event whose signature produced the snapshot's verdict. Selection
 * skips attestations that do not verify, so the verdict's own event is the one
 * matching the verified signature id — not simply the first attestation read.
 */
export const verdictAttestation = (snapshot: SafenetCheckSnapshot): AttestedCheckEvent | undefined => {
  const { signatureId } = snapshot.attestation
  if (signatureId === null) return undefined
  return attestationCandidates(snapshot.events).find((event) => event.signatureId === signatureId)
}
