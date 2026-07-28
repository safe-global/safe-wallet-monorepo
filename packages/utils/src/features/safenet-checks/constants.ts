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

/** First non-empty value, or `undefined`. */
const firstDefined = (...values: Array<string | undefined>): string | undefined => {
  for (const value of values) {
    if (value !== undefined && value !== '') return value
  }
  return undefined
}

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
  firstDefined(process.env.NEXT_PUBLIC_SAFENET_CHAIN_ID, process.env.EXPO_PUBLIC_SAFENET_CHAIN_ID) ?? '100'

/** Pinned Gnosis RPC endpoints for the read layer (csv). Rotated on failure. */
export const SAFENET_RPC_URLS = parseCsv(
  firstDefined(process.env.NEXT_PUBLIC_SAFENET_RPC_URLS, process.env.EXPO_PUBLIC_SAFENET_RPC_URLS) ??
    'https://rpc.gnosischain.com',
)

/** Safenet Consensus contract. Default: Gnosis beta deployment. */
export const SAFENET_CONSENSUS_ADDRESS =
  firstDefined(process.env.NEXT_PUBLIC_SAFENET_CONSENSUS_ADDRESS, process.env.EXPO_PUBLIC_SAFENET_CONSENSUS_ADDRESS) ??
  '0x223624cBF099e5a8f8cD5aF22aFa424a1d1acEE9'

/**
 * Optional FROSTCoordinator override. When unset the reader discovers it via
 * `Consensus.getCoordinator()`. Default: Gnosis beta deployment.
 */
export const SAFENET_COORDINATOR_ADDRESS =
  firstDefined(
    process.env.NEXT_PUBLIC_SAFENET_COORDINATOR_ADDRESS,
    process.env.EXPO_PUBLIC_SAFENET_COORDINATOR_ADDRESS,
  ) ?? '0xaE27021CEB45316f1efe69D8E362aC07ED3Bd7E4'

/**
 * Sentinel-oracle allowlist (csv). **Security-critical, and empty by default.**
 *
 * `Consensus.proposeOracleTransaction` is permissionless and takes the oracle
 * address as a caller argument, so the `oracle` field on a proposal event is
 * attacker-chosen. Sourcing oracle logs from it would let anyone emit a
 * fabricated `OracleResult(approved=false)` from their own contract and paint
 * any Safe transaction `MALICIOUS`. The reader therefore only ever reads oracle
 * events from an address on this list.
 *
 * Empty (today's default) means no sentinel oracle is trusted, so the oracle
 * path is skipped entirely — which matches live beta, where only the validator
 * attesters run and no sentinel oracle is deployed. Populate this when one is.
 */
export const SAFENET_ORACLE_ADDRESSES = parseCsv(
  firstDefined(process.env.NEXT_PUBLIC_SAFENET_ORACLE_ADDRESSES, process.env.EXPO_PUBLIC_SAFENET_ORACLE_ADDRESSES),
).map((address) => address.toLowerCase())

// --- Polling / lookback tuning -------------------------------------------------

/** Poll interval before the deadline block. */
export const POLL_INTERVAL_FAST_MS = 6_000

/** Poll interval in the post-deadline late window (a late BENIGN can still land). */
export const POLL_INTERVAL_LATE_MS = 30_000

/**
 * How many blocks past the deadline the reader keeps polling before giving up.
 * ~1h at Gnosis' ~5s block time, so a late attestation replacing a TIMED_OUT
 * verdict has time to materialize.
 */
export const LATE_WINDOW_BLOCKS = 720

/** Hard cap on how far back the reader scans for a check's first event. */
export const MAX_LOOKBACK_BLOCKS = 30_000

/** Max block span per `getLogs` call (Gnosis public RPC ceiling). */
export const GETLOGS_CHUNK_BLOCKS = 10_000

/** Nominal Gnosis block time, used to convert a timestamp into a block estimate. */
export const BLOCK_TIME_SECONDS = 5

/**
 * Half-width of the targeted read window, in blocks. When the caller knows when
 * the Safe transaction happened we scan `estimate ± this` instead of walking back
 * from the chain head, which makes the read cost constant at any age.
 *
 * 5,000 blocks is ~7h either side — the Safenet proposal lands within minutes of
 * the transaction (before or after it executes), so this is generous slack. The
 * full window stays within one `getLogs` chunk.
 */
export const TARGETED_WINDOW_HALF_BLOCKS = 5_000

/** Stop refining the block estimate once it lands within this many seconds. */
export const BLOCK_ESTIMATE_TOLERANCE_SECONDS = 600

/** Max refinement round-trips after the first estimate (each costs one RPC call). */
export const BLOCK_ESTIMATE_MAX_REFINEMENTS = 2

/** Max JSON-RPC calls batched into a single HTTP request by the provider. */
export const PROVIDER_BATCH_MAX_COUNT = 3
