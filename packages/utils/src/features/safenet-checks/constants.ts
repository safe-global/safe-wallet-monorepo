/**
 * Configuration for the Safenet read layer. Shared web+mobile, so every value
 * reads `NEXT_PUBLIC_*` first and falls back to `EXPO_PUBLIC_*`. All reads MUST
 * be static (`process.env.NEXT_PUBLIC_…`): the bundlers only inline literal
 * lookups, so a dynamic one resolves to `undefined` in the browser.
 */

const parseCsv = (value: string | undefined): string[] =>
  value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : []

/**
 * The latest Safenet deployment on Gnosis Chain. Protocol reads target Gnosis
 * only (Sepolia is retired). The singleton reader rejects any configured value
 * that differs from this manifest, so a stale public setting can never select a
 * retired deployment.
 */
export const SAFENET_DEPLOYMENT = {
  chainId: '100',
  consensus: '0x98810887769db19A0Df9bf2f44E4998856fcb390',
  coordinator: '0x2f88C123f34cB3c45482C5b04A0Faf00C6571F44',
  oracles: ['0x544F12bAd6FF72564abBc7eA6494A2a4BdD0DDD0'],
  /** Gnosis block the Oracle was deployed in; no Safenet log exists below it. */
  deploymentBlock: 48_280_806,
} as const

/** First Gnosis block a Safenet log can exist in. */
export const SAFENET_DEPLOYMENT_BLOCK: number = SAFENET_DEPLOYMENT.deploymentBlock

/**
 * The Safenet chain id — feeds both the provider network and the EIP-712 domain
 * attestations are verified against. Blank or unset uses the pinned deployment.
 */
export const SAFENET_CHAIN_ID: string =
  process.env.NEXT_PUBLIC_SAFENET_CHAIN_ID || process.env.EXPO_PUBLIC_SAFENET_CHAIN_ID || SAFENET_DEPLOYMENT.chainId

/** Pinned RPC endpoints for the read layer (csv). Rotated on failure. */
export const SAFENET_RPC_URLS = parseCsv(
  process.env.NEXT_PUBLIC_SAFENET_RPC_URLS || process.env.EXPO_PUBLIC_SAFENET_RPC_URLS || 'https://rpc.gnosischain.com',
)

/** Safenet Consensus contract. A blank or whitespace-only setting uses the pinned deployment. */
export const SAFENET_CONSENSUS_ADDRESS: string =
  process.env.NEXT_PUBLIC_SAFENET_CONSENSUS_ADDRESS?.trim() ||
  process.env.EXPO_PUBLIC_SAFENET_CONSENSUS_ADDRESS?.trim() ||
  SAFENET_DEPLOYMENT.consensus

/** FROSTCoordinator the epoch group keys are read from. Blank or whitespace-only uses the pinned deployment. */
export const SAFENET_COORDINATOR_ADDRESS: string =
  process.env.NEXT_PUBLIC_SAFENET_COORDINATOR_ADDRESS?.trim() ||
  process.env.EXPO_PUBLIC_SAFENET_COORDINATOR_ADDRESS?.trim() ||
  SAFENET_DEPLOYMENT.coordinator

const configuredOracles = parseCsv(
  process.env.NEXT_PUBLIC_SAFENET_ORACLE_ADDRESSES || process.env.EXPO_PUBLIC_SAFENET_ORACLE_ADDRESSES,
)

/**
 * Sentinel-oracle allowlist (csv). `proposeOracleTransaction` is permissionless
 * with a caller-chosen oracle address, so reading verdicts from an unlisted
 * address would let anyone mark any Safe transaction MALICIOUS with a fabricated
 * `OracleResult`. Blank or unset uses the pinned Oracle; it is never empty.
 */
export const SAFENET_ORACLE_ADDRESSES: string[] = configuredOracles.length
  ? configuredOracles
  : [...SAFENET_DEPLOYMENT.oracles]

/** Safenet explorer base URL — display-only deep links to a check's attestation. */
export const SAFENET_EXPLORER_URL = (
  process.env.NEXT_PUBLIC_SAFENET_EXPLORER_URL ||
  process.env.EXPO_PUBLIC_SAFENET_EXPLORER_URL ||
  'https://www.safe.dev/safenet'
).replace(/\/$/, '')

// --- Lookback tuning ------------------------------------------------------

/** Hard cap on how far back the reader scans for a check's first event. */
export const MAX_LOOKBACK_BLOCKS = 30_000

/** Max block span per `getLogs` call (Gnosis public RPC ceiling). */
export const GETLOGS_CHUNK_BLOCKS = 10_000

/**
 * Max blocks of Oracle evidence read per Oracle group. A longer proposal-to-head
 * span reads the first and last half of the cap and reports incomplete evidence.
 */
export const MAX_EVIDENCE_BLOCKS = 60_000

/** Nominal Gnosis block time, used to seed the block-at-timestamp estimate. */
export const BLOCK_TIME_SECONDS = 5

/**
 * How far behind the estimated transaction block the targeted window starts.
 * Weighted forward: every event the read looks for is emitted at or after the
 * Safe transaction, so the backward reach only covers estimate error (~1.4h),
 * leaving ~12.5h ahead for a late settlement.
 */
export const TARGETED_WINDOW_BACK_BLOCKS = 1_000

/** Stop refining the block estimate once it lands within this many seconds. */
export const BLOCK_ESTIMATE_TOLERANCE_SECONDS = 600

/** Max refinement round-trips after the first probe (each costs one RPC call). */
export const BLOCK_ESTIMATE_MAX_REFINEMENTS = 2

/**
 * Max JSON-RPC calls batched into one HTTP request. Equals
 * `MAX_LOOKBACK_BLOCKS / GETLOGS_CHUNK_BLOCKS`, so a head-relative read is a
 * single round-trip.
 */
export const PROVIDER_BATCH_MAX_COUNT = 3

// --- Polling tuning -------------------------------------------------------

/** Poll interval while a request can still change quickly (up to its reveal deadline). */
export const POLL_INTERVAL_FAST_MS = 6_000

/** Poll interval for an open request past its fast window. No timeout policy ends it. */
export const POLL_INTERVAL_LATE_MS = 30_000

/** Blocks past the reveal deadline an approved request keeps the fast cadence (~1h). */
export const LATE_WINDOW_BLOCKS = 720

/**
 * How long after submission an UNAVAILABLE read keeps polling. Covers the race
 * where the first read lands before the check request is mined; Gnosis blocks
 * every ~5s, so a request mines well inside this window.
 */
export const UNAVAILABLE_GRACE_MS = 10 * 60_000

/** Poll interval inside {@link UNAVAILABLE_GRACE_MS}. */
export const UNAVAILABLE_GRACE_POLL_MS = 30_000

/** Poll interval for a disputed request, which waits on the arbitration Council. */
export const ARBITRATION_POLL_MS = 5 * 60_000
