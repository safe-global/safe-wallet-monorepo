import type { AttestationVerification, CheckStatus } from './status'
import type { Hex, NormalizedCheckEvent } from './events'

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
