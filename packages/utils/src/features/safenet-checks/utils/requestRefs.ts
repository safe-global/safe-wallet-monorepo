import { getAddress } from 'ethers'
import type { Hex, OracleProposedEvent, RequestRef } from '../types'
import { transactionProposalHash } from './proposalHash'

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

export const refFromEvent = (domain: RequestDomain, event: OracleProposedEvent): RequestRef => ({
  requestId: requestIdOf(domain, event, event.safeTxHash),
  epoch: event.epoch,
  oracle: getAddress(event.oracle),
  oracleDataHash: event.oracleDataHash,
  chainId: event.chainId,
  safe: getAddress(event.safe),
  proposedAt: { blockNumber: event.blockNumber, logIndex: event.logIndex, transactionHash: event.transactionHash },
})

/** Deduplicate references by request id, keeping the first one seen. */
export const dedupeRequestRefs = (refs: ReadonlyArray<RequestRef>): RequestRef[] => {
  const byId = new Map<Hex, RequestRef>()
  for (const ref of refs) if (!byId.has(ref.requestId)) byId.set(ref.requestId, ref)
  return [...byId.values()]
}
