/**
 * Normalized Safenet lifecycle events. Every onchain uint is carried as a
 * decimal string so the whole tree is Redux-serializable. `Hex` is re-exported
 * from `@safe-global/types-kit` so feature code keeps importing from `../types`.
 */

import type { Hex } from '@safe-global/types-kit'

export type { Hex }

export enum CheckEventType {
  /** Consensus `TransactionProposed` from the unified oracle pair (`safeId` + oracle). */
  ORACLE_PROPOSED = 'ORACLE_PROPOSED',
  /** Consensus `TransactionAttested` from the oracle pair — carries the FROST signature. */
  ORACLE_ATTESTED = 'ORACLE_ATTESTED',
  /** Consensus `TransactionProposed` — the non-oracle path live beta uses. */
  PLAIN_PROPOSED = 'PLAIN_PROPOSED',
  /** Consensus `TransactionAttested` — the non-oracle attestation. */
  PLAIN_ATTESTED = 'PLAIN_ATTESTED',
  /** Sentinel `NewRequest` — carries the per-check deadline block. */
  REQUEST_CREATED = 'REQUEST_CREATED',
  /** Sentinel `Committed` — a blind commitment; the verdict arrives with the reveal. */
  SENTINEL_COMMITTED = 'SENTINEL_COMMITTED',
  /** Sentinel `Revealed` — carries the per-sentinel verdict. */
  SENTINEL_REVEALED = 'SENTINEL_REVEALED',
  /** `OracleResult` — the oracle's final approved flag. */
  ORACLE_RESULT = 'ORACLE_RESULT',
  /** `DisputeResolved` — a frozen/contested request was resolved. */
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
}

/** Fields present on every decoded event; used for ordering and de-duplication. */
export type CheckEventBase = {
  blockNumber: number
  logIndex: number
  transactionHash: string
}

export type OracleProposedEvent = CheckEventBase & {
  type: CheckEventType.ORACLE_PROPOSED
  safeTxHash: Hex
  chainId: string
  safe: string
  epoch: string
  oracle: string
  /** keccak256 of the proposal's `oracleData`; derives the requestId. */
  oracleDataHash: Hex
}

type FrostSignature = {
  r: { x: string; y: string }
  z: string
}

export type OracleAttestedEvent = CheckEventBase & {
  type: CheckEventType.ORACLE_ATTESTED
  safeTxHash: Hex
  chainId: string
  safe: string
  epoch: string
  oracle: string
  signatureId: Hex
  attestation: FrostSignature
  /** The EIP-712 encoding of `oracleData`, needed for the attestation preimage. */
  oracleDataHash: Hex
}

export type PlainProposedEvent = CheckEventBase & {
  type: CheckEventType.PLAIN_PROPOSED
  safeTxHash: Hex
  chainId: string
  safe: string
  epoch: string
}

export type PlainAttestedEvent = CheckEventBase & {
  type: CheckEventType.PLAIN_ATTESTED
  safeTxHash: Hex
  chainId: string
  safe: string
  epoch: string
  signatureId: Hex
  attestation: FrostSignature
}

export type RequestCreatedEvent = CheckEventBase & {
  type: CheckEventType.REQUEST_CREATED
  requestId: Hex
  proposer: string
  fee: string
  bondTarget: string
  /** The reveal deadline — past it an unattested request can only time out. */
  deadlineBlock: string
  commitDeadlineBlock: string
}

export type SentinelCommittedEvent = CheckEventBase & {
  type: CheckEventType.SENTINEL_COMMITTED
  requestId: Hex
  sentinel: string
  /** Commits are blind — the verdict only appears in `Revealed`. */
  bondAmount: string
}

export type SentinelRevealedEvent = CheckEventBase & {
  type: CheckEventType.SENTINEL_REVEALED
  requestId: Hex
  sentinel: string
  approved: boolean
  bondAmount: string
  reason: string
}

export type OracleResultEvent = CheckEventBase & {
  type: CheckEventType.ORACLE_RESULT
  requestId: Hex
  proposer: string
  approved: boolean
  result: Hex
}

export type DisputeResolvedEvent = CheckEventBase & {
  type: CheckEventType.DISPUTE_RESOLVED
  requestId: Hex
  outcome: number
  slashed: string
}

export type NormalizedCheckEvent =
  | OracleProposedEvent
  | OracleAttestedEvent
  | PlainProposedEvent
  | PlainAttestedEvent
  | RequestCreatedEvent
  | SentinelCommittedEvent
  | SentinelRevealedEvent
  | OracleResultEvent
  | DisputeResolvedEvent

/** The two attesting events. Both carry the attested Safe's chain id and address. */
export type AttestedCheckEvent = OracleAttestedEvent | PlainAttestedEvent
