import type { AttestationVerification, CheckStatus } from './status'
import type { CheckEventBase, Hex, NormalizedCheckEvent, OracleAttestedEvent } from './events'

/**
 * How much the block ranges a read used can prove. `proven`: the discovery
 * ranges continuously cover the deployment block through the observed head, so
 * finding no request means none exists. `heuristic`: they do not, so finding
 * nothing only means the read did not look everywhere a request could be.
 * Submission timestamps are hints that place a window; they never prove absence.
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

/** Identity of one Oracle request, carried across polls. */
export type RequestRef = {
  requestId: Hex
  epoch: string
  oracle: string
  oracleDataHash: Hex
  /** The checked Safe's home chain, not the protocol chain. */
  chainId: string
  safe: string
  /** Where the proposal was seen; null when only its attestation was visible. */
  proposedAt: CheckEventBase | null
}

export type SentinelVote = {
  sentinel: string
  /** Null while the sentinel has committed but not revealed. */
  approved: boolean | null
  /** Opaque text. A revealed empty reason is `''`; null means not revealed. */
  reason: string | null
  bondAmount: string
  commitTxHash: string | null
  revealTxHash: string | null
}

/** How a non-unanimous or timed-out request closed, when the logs say. */
export type RequestResolution = 'COUNCIL' | 'OUT_OF_SCOPE' | 'ARBITRATION_TIMEOUT' | 'REQUEST_TIMEOUT'

/** One request's authoritative state at the observed head plus its bounded evidence. */
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
  /** True only when the logs cover proposal-to-head and match the getter's counts. */
  evidenceComplete: boolean
}

/** The fields a FROST verification needs from an attestation, from a log or a getter. */
export type AttestationInput = Pick<
  OracleAttestedEvent,
  'epoch' | 'oracle' | 'oracleDataHash' | 'safeTxHash' | 'signatureId' | 'attestation'
>

/** An attestation bound to the request it can settle. `event` is null for getter-only evidence. */
export type AttestationCandidate = {
  requestId: Hex
  input: AttestationInput
  event: OracleAttestedEvent | null
}

/** A request with its own verification result — never shared with a sibling request. */
export type RequestSnapshot = RequestRead & {
  attestation: AttestationVerification
  attestedEvent: OracleAttestedEvent | null
  /** Null for getter-only evidence or when the header read failed. */
  attestedAtMs: number | null
}

/**
 * The full read-layer view of one check at one poll. Everything numeric is a
 * decimal string so the snapshot is safe to hold in Redux. Replaced as a unit
 * after every successful poll; a failed poll leaves the last one in place.
 */
export type SafenetCheckSnapshot = {
  safeTxHash: Hex
  /** The Safenet chain the Consensus contract lives on (e.g. Gnosis '100'). */
  chainId: string
  status: CheckStatus
  /** Exact lifecycle/outcome of the deciding request; null when no request exists. */
  outcome: RequestOutcome | null
  /**
   * The deciding request and its facts. Proposals are permissionless, so these
   * describe the request that decided `status`, not the latest proposal.
   */
  requestId: Hex | null
  epoch: string | null
  oracle: string | null
  /** The deciding request's arbitration deadline when disputed, else its reveal deadline. */
  deadlineBlock: string | null
  /** Chain head observed at snapshot time. */
  headBlock: string | null
  /** Wall-clock time of the observed head block, in ms. */
  headAtMs: number
  /** When the store stamped this snapshot, in ms. */
  observedAtMs: number
  /** The deciding request's verification result. */
  attestation: AttestationVerification
  /**
   * When the deciding request's attestation landed, in ms. Null until attested,
   * for getter-only evidence, and when the header read failed.
   */
  attestedAtMs: number | null
  /**
   * The submission time this read aimed its block window at, in ms — the
   * earliest one any surface offered for the check. Null when none was offered.
   * A subscriber that knows an earlier time compares against this to decide
   * whether to re-aim the read.
   */
  aimedAtMs: number | null
  /** What an empty request set from this read is allowed to claim. */
  windowCoverage: WindowCoverage
  /** Every target-bound request, each with its own state, votes and verification. */
  requests: RequestSnapshot[]
  /** Lifecycle evidence only; discovery exhaustiveness is `windowCoverage`. */
  evidenceComplete: boolean
  /** Target-bound decoded events, sorted ascending by (block, logIndex). */
  events: NormalizedCheckEvent[]
}
