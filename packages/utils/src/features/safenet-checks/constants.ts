/**
 * Configuration for the Safenet read layer. Shared web+mobile, so every value
 * reads the `NEXT_PUBLIC_*` variable first and falls back to `EXPO_PUBLIC_*`.
 *
 * These MUST be referenced statically (`process.env.NEXT_PUBLIC_…`). The web
 * (webpack/Next) and mobile (Expo/Babel) bundlers only inline literal
 * `process.env.<PREFIX>_*` reads — a dynamic `process.env[…]` lookup is left
 * untouched and resolves to `undefined` in the browser, silently leaving the
 * reader with no RPC URLs.
 */

const parseCsv = (value: string | undefined): string[] =>
  value
    ? value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : []

/**
 * The Safenet chain id — feeds BOTH the reader's provider network AND the
 * EIP-712 domain used to derive request ids. A wrong value silently derives
 * wrong request ids (checks stuck at SUBMITTED), so the reader asserts it
 * against `eth_chainId` in development.
 */
export const SAFENET_CHAIN_ID =
  process.env.NEXT_PUBLIC_SAFENET_CHAIN_ID || process.env.EXPO_PUBLIC_SAFENET_CHAIN_ID || '100'

/** Pinned Gnosis RPC endpoints for the read layer (csv). Rotated on failure. */
export const SAFENET_RPC_URLS = parseCsv(
  process.env.NEXT_PUBLIC_SAFENET_RPC_URLS || process.env.EXPO_PUBLIC_SAFENET_RPC_URLS || 'https://rpc.gnosischain.com',
)

/** Safenet Consensus contract. Default: Gnosis beta deployment. */
export const SAFENET_CONSENSUS_ADDRESS =
  process.env.NEXT_PUBLIC_SAFENET_CONSENSUS_ADDRESS ||
  process.env.EXPO_PUBLIC_SAFENET_CONSENSUS_ADDRESS ||
  '0x223624cBF099e5a8f8cD5aF22aFa424a1d1acEE9'

/**
 * Sentinel-oracle allowlist (csv). Security-critical, and empty by default.
 *
 * `Consensus.proposeOracleTransaction` is permissionless and takes the oracle
 * address as a caller argument, so the `oracle` field on a proposal event is
 * chosen by whoever called it. Sourcing oracle logs from that field would let
 * anyone emit a fabricated `OracleResult(approved=false)` from their own
 * contract and mark any Safe transaction `MALICIOUS`. The reader only reads
 * oracle events from an address on this list, normalized in the constructor.
 *
 * The allowlist limits which address a verdict can come from. It does not limit
 * who can ask for one. `proposeOracleTransaction` forwards the caller's
 * transaction tuple to the named oracle through `postRequest`, so anyone who
 * pays the request fee can have the sentinels evaluate another user's Safe
 * transaction, including one whose owner only ever used the plain path. That
 * verdict is real and the reader cannot filter it out. This is the tradeoff
 * that comes with populating the list.
 *
 * The default empty list trusts no sentinel oracle, so the oracle path is
 * skipped. That matches live beta, where only the validator attesters run and
 * no sentinel oracle is deployed. Populate this once one is.
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
 *
 * The window is weighted forward on purpose. Every event the read looks for
 * (`Proposed`, `Attested`, `NewRequest`, `Committed`, `OracleResult`) is emitted
 * at or after the Safe transaction, so the backward reach only has to cover
 * estimate error and skew between the caller's submission timestamp and chain
 * time. A converged estimate is within {@link BLOCK_ESTIMATE_TOLERANCE_SECONDS},
 * about 120 blocks at nominal cadence. 1,000 blocks gives roughly 1.4h of slack,
 * leaving about 9,000 blocks (12.5h) ahead, where a late settlement lands.
 */
export const TARGETED_WINDOW_BACK_BLOCKS = 1_000

/** Stop refining the block estimate once it lands within this many seconds. */
export const BLOCK_ESTIMATE_TOLERANCE_SECONDS = 600

/** Max refinement round-trips after the first probe (each costs one RPC call). */
export const BLOCK_ESTIMATE_MAX_REFINEMENTS = 2

/**
 * Max JSON-RPC calls batched into a single HTTP request by the provider.
 * Equals `MAX_LOOKBACK_BLOCKS / GETLOGS_CHUNK_BLOCKS`, so a head-relative read
 * is one HTTP round-trip. Changing either of those without changing this splits
 * every head-relative read into two.
 */
export const PROVIDER_BATCH_MAX_COUNT = 3
