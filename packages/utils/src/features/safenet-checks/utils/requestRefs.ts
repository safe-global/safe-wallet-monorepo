import { getAddress } from 'ethers'
import { CheckEventType, type Hex, type OracleAttestedEvent, type OracleProposedEvent, type RequestRef } from '../types'
import { matchesCheckTarget, type CheckTarget } from './attestations'
import { transactionProposalHash } from './proposalHash'

/** Cap on distinct request ids per Oracle in one read — bounds the OR-filter and the getter fan-out. */
export const MAX_REQUESTS_PER_ORACLE = 16

/** The protocol chain and Consensus contract the request-id EIP-712 domain is built from. */
export type RequestDomain = { chainId: string; consensus: string }

export const requestIdOf = (
  domain: RequestDomain,
  ref: Pick<RequestRef, 'epoch' | 'oracle' | 'oracleDataHash'>,
  safeTxHash: Hex,
): Hex =>
  transactionProposalHash({
    ...domain,
    epoch: ref.epoch,
    oracle: ref.oracle,
    oracleDataHash: ref.oracleDataHash,
    safeTxHash,
  })

/** A request reference from a Consensus log. Only a proposal fixes `proposedAt`. */
export const refFromEvent = (domain: RequestDomain, event: OracleProposedEvent | OracleAttestedEvent): RequestRef => ({
  requestId: requestIdOf(domain, event, event.safeTxHash),
  epoch: event.epoch,
  oracle: getAddress(event.oracle),
  oracleDataHash: event.oracleDataHash,
  chainId: event.chainId,
  safe: getAddress(event.safe),
  proposedAt:
    event.type === CheckEventType.ORACLE_PROPOSED
      ? { blockNumber: event.blockNumber, logIndex: event.logIndex, transactionHash: event.transactionHash }
      : null,
})

const INVALID_KNOWN_REF = 'Safenet reader: invalid known request reference'

/**
 * Carried references that are bound to `target` and name an allowlisted Oracle,
 * with their addresses normalized. Each must recompute to its own request id
 * under this deployment's domain; one that does not fails the read.
 */
export const acceptKnownRequests = (
  domain: RequestDomain,
  safeTxHash: Hex,
  target: CheckTarget,
  oracles: ReadonlyArray<string>,
  known: ReadonlyArray<RequestRef> = [],
): RequestRef[] =>
  known
    .filter((ref) => matchesCheckTarget(ref, target) && oracles.includes(ref.oracle.toLowerCase()))
    .map((ref) => {
      let normalized: RequestRef
      try {
        // Only the reference fields: a carried snapshot also holds state and verification that must not leak.
        normalized = {
          requestId: ref.requestId,
          epoch: ref.epoch,
          oracle: getAddress(ref.oracle),
          oracleDataHash: ref.oracleDataHash,
          chainId: ref.chainId,
          safe: getAddress(ref.safe),
          proposedAt: ref.proposedAt,
        }
      } catch {
        throw new Error(INVALID_KNOWN_REF)
      }
      const requestId = requestIdOf(domain, normalized, safeTxHash)
      if (requestId !== ref.requestId.toLowerCase()) throw new Error(INVALID_KNOWN_REF)
      return { ...normalized, requestId }
    })

/**
 * Deduplicate references by request id, in first-seen order. A later duplicate
 * only contributes a proposal position the earlier one lacks.
 */
export const dedupeRequestRefs = (refs: ReadonlyArray<RequestRef>): RequestRef[] => {
  const byId = new Map<Hex, RequestRef>()
  for (const ref of refs) {
    const existing = byId.get(ref.requestId)
    byId.set(ref.requestId, existing ? { ...existing, proposedAt: existing.proposedAt ?? ref.proposedAt } : ref)
  }
  return [...byId.values()]
}

/** Fail rather than drop a request: an older negative one must never make room for a newer one. */
export const assertRequestCap = (refs: ReadonlyArray<RequestRef>): void => {
  const perOracle = new Map<string, number>()
  for (const { oracle } of refs) {
    const key = oracle.toLowerCase()
    const count = (perOracle.get(key) ?? 0) + 1
    if (count > MAX_REQUESTS_PER_ORACLE) throw new Error('Safenet reader: too many requests for this transaction')
    perOracle.set(key, count)
  }
}
