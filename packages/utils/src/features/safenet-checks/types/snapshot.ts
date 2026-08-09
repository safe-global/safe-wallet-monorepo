import type { AttestationVerification, CheckStatus } from './status'
import type { Hex, NormalizedCheckEvent, OracleGeneration } from './events'

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
  /** Which oracle generation drove the active request, once a sentinel event lands. */
  generation: OracleGeneration | null
  /**
   * Correlation for the latest allowlisted proposal, once known. Proposals are
   * permissionless — do not render these as provenance or branch a verdict on
   * them; use `status` for that.
   */
  requestId: Hex | null
  epoch: string | null
  oracle: string | null
  /** Block the check times out at (V1 `deadline` / V2 `revealDeadline`). */
  deadlineBlock: string | null
  /** Chain head observed at snapshot time — the deadline is compared to this. */
  headBlock: string | null
  attestation: AttestationVerification
  /** All decoded lifecycle events, sorted ascending by (block, logIndex). */
  events: NormalizedCheckEvent[]
}
