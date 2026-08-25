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
export const attestationCandidates = (events: ReadonlyArray<NormalizedCheckEvent>): AttestedCheckEvent[] =>
  events
    .filter(isAttested)
    .sort((a, b) => familyRank(b) - familyRank(a) || b.blockNumber - a.blockNumber || b.logIndex - a.logIndex)

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
