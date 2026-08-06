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

// --- Lookback tuning ------------------------------------------------------

/** Hard cap on how far back the reader scans for a check's first event. */
export const MAX_LOOKBACK_BLOCKS = 30_000

/** Max block span per `getLogs` call (Gnosis public RPC ceiling). */
export const GETLOGS_CHUNK_BLOCKS = 10_000

/** Max JSON-RPC calls batched into a single HTTP request by the provider. */
export const PROVIDER_BATCH_MAX_COUNT = 3
