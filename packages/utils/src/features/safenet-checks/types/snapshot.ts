import type { AttestationVerification, CheckStatus } from './status'
import type { CheckEventBase, Hex, NormalizedCheckEvent } from './events'

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

/**
 * The full read-layer view of one check at one poll. Everything numeric is a
 * decimal string so the snapshot is safe to hold in Redux. Recomputed from
 * scratch each poll; the monotonic merge is applied on top separately.
 */
export type SafenetCheckSnapshot = {
  safeTxHash: Hex
  /** The Safenet chain the Consensus contract lives on (e.g. Gnosis '100'). */
  chainId: string
  status: CheckStatus
  /**
   * Correlation for the latest allowlisted proposal, once known. Proposals are
   * permissionless — do not render these as provenance or branch a verdict on
   * them; use `status` for that.
   */
  requestId: Hex | null
  epoch: string | null
  oracle: string | null
  /** Block the check times out at (the request's reveal deadline). */
  deadlineBlock: string | null
  /** Chain head observed at snapshot time — the deadline is compared to this. */
  headBlock: string | null
  /** Every allowlisted request this read discovered, in proposal order. */
  requests: RequestRead[]
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
