/**
 * TypeScript types for Safe-related test data.
 * Mirrors CGW API response shapes used in tests.
 */

/** Prefixed address format: "sep:0x..." */
export type PrefixedAddress = `${string}:0x${string}`

/** Safe info from CGW /v1/safes/{address} */
export interface SafeInfo {
  address: { value: string }
  chainId: string
  nonce: number
  threshold: number
  owners: Array<{ value: string }>
  implementation: { value: string }
  modules: Array<{ value: string }>
  fallbackHandler: { value: string }
  guard: { value: string } | null
  version: string
}

/** Token balance from CGW /v1/safes/{address}/balances */
export interface TokenBalance {
  tokenInfo: {
    type: string
    address: string
    decimals: number
    symbol: string
    name: string
    logoUri: string | null
  }
  balance: string
  fiatBalance: string
  fiatConversion: string
}

/** Balances response from CGW */
export interface BalancesResponse {
  fiatTotal: string
  items: TokenBalance[]
}
