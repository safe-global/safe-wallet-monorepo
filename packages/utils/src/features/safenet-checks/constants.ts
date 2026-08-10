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
 * The Safenet chain id — feeds both the provider network and the EIP-712 domain
 * request ids derive from. A wrong value leaves every check stuck at SUBMITTED,
 * so the reader asserts it against `eth_chainId` in development.
 */
export const SAFENET_CHAIN_ID =
  process.env.NEXT_PUBLIC_SAFENET_CHAIN_ID || process.env.EXPO_PUBLIC_SAFENET_CHAIN_ID || '100'

/** Pinned RPC endpoints for the read layer (csv). Rotated on failure. */
export const SAFENET_RPC_URLS = parseCsv(
  process.env.NEXT_PUBLIC_SAFENET_RPC_URLS || process.env.EXPO_PUBLIC_SAFENET_RPC_URLS || 'https://rpc.gnosischain.com',
)

/** Safenet Consensus contract. Default: Gnosis beta deployment. */
export const SAFENET_CONSENSUS_ADDRESS =
  process.env.NEXT_PUBLIC_SAFENET_CONSENSUS_ADDRESS ||
  process.env.EXPO_PUBLIC_SAFENET_CONSENSUS_ADDRESS ||
  '0x223624cBF099e5a8f8cD5aF22aFa424a1d1acEE9'

/** FROSTCoordinator the epoch group keys are read from. Default: Gnosis beta. */
export const SAFENET_COORDINATOR_ADDRESS =
  process.env.NEXT_PUBLIC_SAFENET_COORDINATOR_ADDRESS ||
  process.env.EXPO_PUBLIC_SAFENET_COORDINATOR_ADDRESS ||
  '0xaE27021CEB45316f1efe69D8E362aC07ED3Bd7E4'

/**
 * Sentinel-oracle allowlist (csv). `proposeOracleTransaction` is permissionless
 * with a caller-chosen oracle address, so reading verdicts from an unlisted
 * address would let anyone mark any Safe transaction MALICIOUS with a fabricated
 * `OracleResult`. Empty (the default) skips the oracle path entirely, matching
 * live beta where no sentinel oracle is deployed.
 */
export const SAFENET_ORACLE_ADDRESSES = parseCsv(
  process.env.NEXT_PUBLIC_SAFENET_ORACLE_ADDRESSES || process.env.EXPO_PUBLIC_SAFENET_ORACLE_ADDRESSES,
)

// --- Lookback tuning ------------------------------------------------------

/** Hard cap on how far back the reader scans for a check's first event. */
export const MAX_LOOKBACK_BLOCKS = 30_000

/** Max block span per `getLogs` call (Gnosis public RPC ceiling). */
export const GETLOGS_CHUNK_BLOCKS = 10_000

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

/** Poll interval before the deadline block. */
export const POLL_INTERVAL_FAST_MS = 6_000

/** Poll interval in the post-deadline late window (a late BENIGN can still land). */
export const POLL_INTERVAL_LATE_MS = 30_000

/** How many blocks past the deadline polling continues (~1h at Gnosis cadence). */
export const LATE_WINDOW_BLOCKS = 720

/**
 * Deadline substitute for the plain path, which emits none: an attestation is
 * expected within this many blocks of the first observed event (~20 min; beta
 * attests within ~5 blocks). Without it, a proposed-but-never-attested check
 * would poll a public RPC at the fast interval forever.
 */
export const PLAIN_DEADLINE_BLOCKS = 240
