import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'

/**
 * Hardcoded allowlist of accepted gas tokens per chain. Interim until [PLA-1389] swaps this
 * for an HTTP-fetched list. Order in each array reflects the surfacing priority for the
 * gas-token selector: native first, then stablecoins (USDC → USDT → DAI), then wrapped native,
 * then "other" (PYUSD).
 */

/**
 * Sentinel for the chain's native gas token. Matched against ZERO_ADDRESS in balances.
 */
export const NATIVE_SENTINEL = 'native' as const

export type GasTokenAllowlistEntry = {
  /** Lowercase contract address, or `'native'` for the chain's gas token. */
  address: string
}

/**
 * Allowlisted gas tokens keyed by chainId (decimal string).
 *
 * Notable exclusions:
 * - Bridged USDC.e on Arbitrum (`0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8`) — only native USDC.
 * - Bridged USDC.e on Polygon (`0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`) — only native USDC.
 * - Any chain not listed → native only (no ERC-20 gas tokens offered).
 */
export const GAS_TOKEN_ALLOWLIST: Readonly<Record<string, readonly GasTokenAllowlistEntry[]>> = {
  // Ethereum
  '1': [
    { address: NATIVE_SENTINEL },
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' }, // USDC (Circle)
    { address: '0xdac17f958d2ee523a2206206994597c13d831ec7' }, // USDT (Tether)
    { address: '0x6b175474e89094c44da98b954eedeac495271d0f' }, // DAI (Sky/MakerDAO)
    { address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' }, // WETH
    { address: '0x6c3ea9036406852006290770bedfcaba0e23a0e8' }, // PYUSD (Paxos)
  ],
  // BNB Chain — note: USDT contract's on-chain symbol is BSC-USD, displayed as-is
  '56': [
    { address: NATIVE_SENTINEL },
    { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' }, // USDC (Binance-pegged)
    { address: '0x55d398326f99059ff775485246999027b3197955' }, // USDT / BSC-USD (Binance-pegged)
    { address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' }, // WBNB
  ],
  // Base
  '8453': [
    { address: NATIVE_SENTINEL },
    { address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' }, // USDC (Circle)
    { address: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2' }, // USDT (bridged by GFX Labs)
    { address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb' }, // DAI (Superchain bridge)
    { address: '0x4200000000000000000000000000000000000006' }, // WETH (OP Stack predeploy)
  ],
  // Arbitrum One
  '42161': [
    { address: NATIVE_SENTINEL },
    { address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831' }, // USDC native (Circle) — NOT USDC.e
    { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9' }, // USDT / USD₮0 (Tether canonical)
    { address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1' }, // DAI
    { address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1' }, // WETH
    { address: '0x46850ad61c2b7d64d08c9c754f45254596696984' }, // PYUSD (Paxos)
  ],
  // Polygon — off-spec for PLA-1412 but enabled here for our QA/staging environments.
  '137': [
    { address: NATIVE_SENTINEL },
    { address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' }, // USDC native (Circle) — NOT USDC.e (0x2791…)
    { address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063' }, // DAI (canonical bridged)
  ],
}

const matchesEntry = (entry: GasTokenAllowlistEntry, address: string): boolean =>
  entry.address === NATIVE_SENTINEL ? sameAddress(address, ZERO_ADDRESS) : sameAddress(entry.address, address)

/**
 * Position of `address` in the chain's allowlist, or `-1` if not allowlisted (or chain unsupported).
 * Used for sorting candidates by surfacing priority.
 */
export const getGasTokenAllowlistOrder = (chainId: string, address: string): number => {
  const list = GAS_TOKEN_ALLOWLIST[chainId]
  if (!list) return -1
  return list.findIndex((entry) => matchesEntry(entry, address))
}

/**
 * Whether `address` is allowed as a gas token on `chainId`. The chain's native gas token is
 * always allowed (even on chains absent from the allowlist), so the selector still works on
 * unsupported chains by offering the native token only.
 */
export const isAllowlistedGasToken = (chainId: string, address: string): boolean => {
  if (sameAddress(address, ZERO_ADDRESS)) return true
  const list = GAS_TOKEN_ALLOWLIST[chainId]
  if (!list) return false
  return list.some((entry) => matchesEntry(entry, address))
}
