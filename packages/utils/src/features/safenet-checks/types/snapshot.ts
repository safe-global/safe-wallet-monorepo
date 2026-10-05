import type { AttestationVerification, CheckStatus } from './status'
import type { CheckEventBase, Hex, NormalizedCheckEvent, OracleAttestedEvent } from './events'

/**
 * How much the block window a read used can prove. `proven`: the window was
 * placed from a real submission timestamp with a converged block estimate AND
 * still runs to the chain head, so it covers the check's whole possible
 * lifetime — finding nothing there means nothing is there. `heuristic`: the
 * window was head-relative, or placed from an estimate that did not converge,
 * or it ends short of the head, so finding nothing only means the read did not
 * look everywhere the check could be.
 */
export type WindowCoverage = 'proven' | 'heuristic'

/** The Oracle's request state, mapped from `getRequest` ordinals 1..5. */
export type OracleRequestState = 'PENDING' | 'FROZEN' | 'RESOLVED_APPROVED' | 'RESOLVED_DENIED' | 'TIMED_OUT'

/**
 * What a request resolved to, derived only from its state and vote counts. A
 * mixed-vote ruling (`RULED_*`) is a Council decision, never a unanimous one.
 */
export type RequestOutcome =
  | 'PENDING'
  | 'APPROVED'
  | 'DENIED'
  | 'DISPUTED'
  | 'RULED_SECURE'
  | 'RULED_INSECURE'
  | 'NO_RULING'
  | 'TIMED_OUT'

/** Identity of one Oracle request, from the allowlisted proposal that named it. */
export type RequestRef = {
  requestId: Hex
  epoch: string
  oracle: string
  oracleDataHash: Hex
  /** The checked Safe's home chain, not the protocol chain. */
  chainId: string
  safe: string
  proposedAt: CheckEventBase
}

export type SentinelVote = {
  sentinel: string
  /** Null while the sentinel has committed but not revealed. */
  approved: boolean | null
  /**
   * Opaque text. A revealed empty reason is `''`; null when not revealed, or when the revealed bytes are not
   * valid UTF-8 (then `approved` is set).
   */
  reason: string | null
  bondAmount: string
  commitTxHash: string | null
  revealTxHash: string | null
}

/** How a non-unanimous or timed-out request closed, when the logs say. */
export type RequestResolution = 'COUNCIL' | 'OUT_OF_SCOPE' | 'ARBITRATION_TIMEOUT' | 'REQUEST_TIMEOUT'

/** One request's authoritative state at the observed head plus the votes and resolution its logs show. */
export type RequestRead = RequestRef & {
  state: OracleRequestState
  outcome: RequestOutcome
  commitDeadlineBlock: string
  revealDeadlineBlock: string
  /** Null when no dispute opened. */
  arbitrationDeadlineBlock: string | null
  committedCount: number
  revealedCount: number
  approveCount: number
  denyCount: number
  votes: SentinelVote[]
  resolution: RequestResolution | null
  /** Opaque text from the resolving event; null when unavailable. */
  resolutionContext: string | null
  resolutionTxHash: string | null
}

/** An attested log bound to the request whose id it derives to. */
export type AttestationCandidate = {
  requestId: Hex
  event: OracleAttestedEvent
}

/** A request with its own verification result — never shared with a sibling request. */
export type RequestSnapshot = RequestRead & {
  attestation: AttestationVerification
  attestedEvent: OracleAttestedEvent | null
  /** Null when the request has no attested log or the header read failed. */
  attestedAtMs: number | null
}

/**
 * The full read-layer view of one check at one poll. Everything numeric is a
 * decimal string so the snapshot is safe to hold in Redux. Recomputed from
 * scratch each poll; only a read with no request is merged with the pinned verdict on top.
 */
export type SafenetCheckSnapshot = {
  safeTxHash: Hex
  /** The Safenet chain the Consensus contract lives on (e.g. Gnosis '100'). */
  chainId: string
  status: CheckStatus
  /** Exact lifecycle of the deciding request; null when the read has no request. */
  outcome: RequestOutcome | null
  /**
   * The deciding request: with requests, `requestId`, `epoch`, `oracle`, `deadlineBlock`, `attestation` and
   * `attestedAtMs` all describe it, not the latest proposal. Proposals are permissionless — do not render
   * these as provenance or branch a verdict on them; use `status` for that.
   */
  requestId: Hex | null
  epoch: string | null
  oracle: string | null
  /** The deciding request's arbitration deadline when disputed, else its reveal deadline. */
  deadlineBlock: string | null
  /** Chain head observed at snapshot time — the deadline is compared to this. */
  headBlock: string | null
  /**
   * Every target-bound allowlisted request in the read window, in proposal order. The cap fails the read
   * instead of dropping one; `windowCoverage` says whether the window can have missed one.
   */
  requests: RequestSnapshot[]
  attestation: AttestationVerification
  /**
   * When the attestation landed on chain, in ms. Null until attested, and
   * when the header read failed — a missing date never suppresses a verdict.
   */
  attestedAtMs: number | null
  /**
   * The submission time this read aimed its block window at, in ms — the
   * earliest one any surface offered for the check. Null when none was offered
   * and the read scanned back from the head instead. A subscriber that knows an
   * earlier time compares against this to decide whether to re-aim the read.
   */
  aimedAtMs: number | null
  /** What an empty event set from this read is allowed to claim. */
  windowCoverage: WindowCoverage
  /** All decoded lifecycle events, sorted ascending by (block, logIndex). */
  events: NormalizedCheckEvent[]
}
