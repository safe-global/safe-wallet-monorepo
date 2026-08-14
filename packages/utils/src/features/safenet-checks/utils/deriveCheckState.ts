import {
  AttestationVerificationStatus,
  CheckEventType,
  CheckStatus,
  type AttestationVerification,
  type NormalizedCheckEvent,
} from '../types'

export type DeriveCheckStateInput = {
  /** All decoded events for one check (order-independent; derive is a fold). */
  events: ReadonlyArray<NormalizedCheckEvent>
  /** FROST verification result for the attestation, if any. */
  attestation: AttestationVerification
  /** Current chain head as a decimal string, or null if unknown. */
  headBlock: string | null
}

/** Highest deadline block across the check's request events, or null. Shared with the reader. */
export const deadlineBlockOf = (events: ReadonlyArray<NormalizedCheckEvent>): bigint | null => {
  let deadline: bigint | null = null
  for (const event of events) {
    if (event.type === CheckEventType.REQUEST_CREATED) {
      const value = BigInt(event.deadlineBlock)
      if (deadline === null || value > deadline) deadline = value
    }
  }
  return deadline
}

/**
 * True if the oracle has SETTLED on a rejection.
 *
 * Only `OracleResult` counts. A single sentinel's `Committed`/`Revealed` is one
 * bonded vote, not a verdict: the oracle resolves by unanimity, and a split goes
 * to arbitration which can still approve. Treating one dissent as final would
 * let any single sentinel permanently red-flag a transaction, and `MALICIOUS` is
 * terminal.
 *
 * Invariant (contract coupling): arbitrated rejections still reach this —
 * `SentinelOracle.resolveDispute` emits an `OracleResult` alongside
 * `DisputeResolved`. A hypothetical path emitting `DisputeResolved` WITHOUT its
 * paired `OracleResult` would read as `IN_PROGRESS`/`TIMED_OUT` here, never
 * `MALICIOUS`.
 */
const hasNegativeVerdict = (events: ReadonlyArray<NormalizedCheckEvent>): boolean =>
  events.some((event) => event.type === CheckEventType.ORACLE_RESULT && event.approved === false)

/** True once anything at all has been observed for this hash. */
const hasAnyProposal = (events: ReadonlyArray<NormalizedCheckEvent>): boolean =>
  events.some((event) => event.type === CheckEventType.ORACLE_PROPOSED || event.type === CheckEventType.PLAIN_PROPOSED)

const hasOracleActivity = (events: ReadonlyArray<NormalizedCheckEvent>): boolean =>
  events.some(
    (event) =>
      event.type === CheckEventType.REQUEST_CREATED ||
      event.type === CheckEventType.SENTINEL_COMMITTED ||
      event.type === CheckEventType.SENTINEL_REVEALED ||
      event.type === CheckEventType.ORACLE_RESULT ||
      event.type === CheckEventType.DISPUTE_RESOLVED,
  )

/**
 * Derive the internal check status from a check's full event set.
 *
 * Recompute-from-scratch each poll (idempotent, reorg-self-healing). Precedence,
 * highest first:
 *
 *  1. A negative verdict → `MALICIOUS` (even late, even past deadline).
 *  2. Attested → `BENIGN` if the FROST signature verified, `VERIFICATION_FAILED`
 *     if it did not (never `BENIGN`), else `AWAITING_VERIFICATION`. This sits
 *     above the deadline check so a late-but-verified attestation replaces a
 *     would-be `TIMED_OUT`.
 *  3. Past the deadline block (`head > deadline`) → `TIMED_OUT` (incl. frozen
 *     disputes, which never emit a resolving `OracleResult`).
 *  4. Any oracle lifecycle activity → `IN_PROGRESS` (a positive `OracleResult`
 *     alone lands here — it is NOT `BENIGN` without a verified attestation).
 *  5. Otherwise → `SUBMITTED`.
 */
export const deriveCheckState = ({ events, attestation, headBlock }: DeriveCheckStateInput): CheckStatus => {
  if (hasNegativeVerdict(events)) return CheckStatus.MALICIOUS

  // The attested branches deliberately do NOT require the matching proposal
  // event: an attestation is self-authenticating (its FROST signature commits
  // to safeTxHash/epoch/consensus/chainId), and a targeted read window can
  // catch the attestation while clipping the proposal. Gating on the proposal
  // would degrade a VERIFIED check to UNAVAILABLE on such a partial fetch.
  const attested = events.some((event) => event.type === CheckEventType.ORACLE_ATTESTED)
  if (attested) {
    if (attestation.status === AttestationVerificationStatus.VERIFIED) return CheckStatus.BENIGN
    if (attestation.status === AttestationVerificationStatus.INVALID) return CheckStatus.VERIFICATION_FAILED
    return CheckStatus.AWAITING_VERIFICATION
  }

  // Non-oracle path: the validator set ran its own deterministic checks and
  // attested the result. That is a real passed check, so it resolves to BENIGN —
  // but only on a verified signature, exactly like the oracle path. Sits below
  // the oracle branch (richer checks win) and above the deadline check (it is a
  // settled outcome, not a pending one).
  const plainAttested = events.some((event) => event.type === CheckEventType.PLAIN_ATTESTED)
  if (plainAttested) {
    if (attestation.status === AttestationVerificationStatus.VERIFIED) return CheckStatus.BENIGN
    if (attestation.status === AttestationVerificationStatus.INVALID) return CheckStatus.VERIFICATION_FAILED
    return CheckStatus.AWAITING_VERIFICATION
  }

  const deadline = deadlineBlockOf(events)
  if (deadline !== null && headBlock !== null && BigInt(headBlock) > deadline) {
    return CheckStatus.TIMED_OUT
  }

  if (hasOracleActivity(events)) return CheckStatus.IN_PROGRESS

  // `SUBMITTED` means "we saw the proposal, nothing has happened yet" — it must
  // require an actual proposal event. Falling through to it on an empty event
  // set claimed a check was in flight for every transaction that never had one.
  if (hasAnyProposal(events)) return CheckStatus.SUBMITTED

  return CheckStatus.UNAVAILABLE
}
