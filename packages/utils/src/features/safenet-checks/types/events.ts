/**
 * Normalized Safenet lifecycle events.
 *
 * Every onchain value that is a `uint256`/`uint64`/`uint` is carried as a
 * decimal `string` so the whole tree is Redux-serializable (no bigints ever
 * cross the decode boundary). Point coordinates and scalars (FROST `r`/`z`) are
 * likewise strings.
 */

export type Hex = `0x${string}`

/**
 * Which sentinel-oracle generation produced an event. Consensus events and the
 * shared `OracleResult`/`DisputeResolved` are generation-agnostic (`STABLE`).
 */
export enum OracleGeneration {
  V1 = 'V1',
  V2 = 'V2',
  STABLE = 'STABLE',
}

export enum CheckEventType {
  /** Consensus `OracleTransactionProposed` — the check enters existence. */
  ORACLE_PROPOSED = 'ORACLE_PROPOSED',
  /** Consensus `OracleTransactionAttested` — carries the FROST signature. */
  ORACLE_ATTESTED = 'ORACLE_ATTESTED',
  /**
   * Consensus `TransactionProposed` — the **non-oracle** path: the validator set
   * is asked to attest a Safe transaction with no sentinel oracle in the loop.
   * No fee, no bond, no verdict. This is what live beta traffic overwhelmingly
   * uses today.
   */
  PLAIN_PROPOSED = 'PLAIN_PROPOSED',
  /**
   * Consensus `TransactionAttested` — the non-oracle attestation. Proves the
   * validator set signed the transaction; proves **nothing** about whether it is
   * safe, because no security check ran.
   */
  PLAIN_ATTESTED = 'PLAIN_ATTESTED',
  /** Sentinel `NewRequest` — carries the per-check deadline block. */
  REQUEST_CREATED = 'REQUEST_CREATED',
  /** Sentinel `Committed` — V1 carries the verdict, V2 is activity-only. */
  SENTINEL_COMMITTED = 'SENTINEL_COMMITTED',
  /** Sentinel `Revealed` (V2 only) — carries the per-sentinel verdict. */
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
  generation: OracleGeneration
}

export type OracleProposedEvent = CheckEventBase & {
  type: CheckEventType.ORACLE_PROPOSED
  safeTxHash: Hex
  chainId: string
  safe: string
  epoch: string
  oracle: string
}

export type FrostSignature = {
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
  /**
   * The block the check times out at. Normalized across generations: V1's
   * single `deadline`, or V2's `revealDeadline` (the last block a verdict can
   * still land). V2's earlier `commitDeadline` is kept separately.
   */
  deadlineBlock: string
  commitDeadlineBlock: string | null
}

export type SentinelCommittedEvent = CheckEventBase & {
  type: CheckEventType.SENTINEL_COMMITTED
  requestId: Hex
  sentinel: string
  bondAmount: string
  /** Present in V1 only — V1 commits carry the verdict directly. */
  approved: boolean | null
  /** Present in V1 only. */
  position: string | null
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
