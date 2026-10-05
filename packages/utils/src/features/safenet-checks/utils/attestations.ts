import { CheckEventType, type OracleAttestedEvent, type NormalizedCheckEvent } from '../types'
import type { SafenetCheckSnapshot } from '../types/snapshot'

const isAttested = (event: NormalizedCheckEvent): event is OracleAttestedEvent =>
  event.type === CheckEventType.ORACLE_ATTESTED

/**
 * Newest first: a cross-epoch re-proposal is the protocol's only retry, so an
 * invalid earlier attestation must not terminalize a later valid check.
 */
const attestationCandidates = (events: ReadonlyArray<NormalizedCheckEvent>): OracleAttestedEvent[] =>
  events.filter(isAttested).sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex)

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
): { events: NormalizedCheckEvent[]; candidates: OracleAttestedEvent[] } => {
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
export const verdictAttestation = (snapshot: SafenetCheckSnapshot): OracleAttestedEvent | undefined => {
  const { signatureId } = snapshot.attestation
  if (signatureId === null) return undefined
  return attestationCandidates(snapshot.events).find((event) => event.signatureId === signatureId)
}
