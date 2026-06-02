/**
 * Shared constants for Playwright E2E tests.
 *
 * Rule: All test addresses, URLs, and config live here.
 * Never hardcode addresses in test files — import from this module.
 */

// ---------------------------------------------------------------------------
// Environment / URLs
// ---------------------------------------------------------------------------

export const STAGING_CGW_URL = 'https://safe-client.staging.5afe.dev'
export const CGW_BASE_URL = process.env.SAFE_CGW_BASE_URL || STAGING_CGW_URL

// ---------------------------------------------------------------------------
// Chain IDs
// ---------------------------------------------------------------------------

export const CHAIN_IDS = {
  sepolia: '11155111',
  ethereum: '1',
  polygon: '137',
  gnosis: '100',
} as const

// ---------------------------------------------------------------------------
// Network prefixes (used in Safe URLs: sep:0x...)
// ---------------------------------------------------------------------------

export const NETWORK_PREFIXES = {
  sepolia: 'sep',
  ethereum: 'eth',
  polygon: 'matic',
  gnosis: 'gno',
} as const

// ---------------------------------------------------------------------------
// Static test Safes on Sepolia (read-only — shared across parallel tests)
// ---------------------------------------------------------------------------

export const SAFES = {
  /** 1/1 Safe with ETH balance — use for dashboard and balance tests */
  SEP_STATIC_SAFE_1: 'sep:0x6E834E9D04ad6b26e1525dE1a37BFd9b215f40B7',
  /** 1/2 Safe — use for multi-owner and tx queue tests */
  SEP_STATIC_SAFE_2: 'sep:0xc2F3645bfd395516d1a18CA6ad9298299d328C01',
} as const

// ---------------------------------------------------------------------------
// Test wallet addresses
// ---------------------------------------------------------------------------

export const TEST_ADDRESSES = {
  /** Known EOA — not an owner of any test Safe */
  NON_OWNER: '0x1234567890123456789012345678901234567890',
  /** Zero address — for edge case tests */
  ZERO: '0x0000000000000000000000000000000000000000',
} as const

// ---------------------------------------------------------------------------
// URL route patterns
// ---------------------------------------------------------------------------

export const ROUTES = {
  home: '/home',
  balances: '/balances',
  transactions: '/transactions',
  transactionsQueue: '/transactions/queue',
  transactionsHistory: '/transactions/history',
  settings: '/settings',
  addressBook: '/address-book',
  apps: '/apps',
} as const

// ---------------------------------------------------------------------------
// localStorage keys (namespace: SAFE_v2__)
// ---------------------------------------------------------------------------

export const LS_NAMESPACE = 'SAFE_v2__'

export const LS_KEYS = {
  cookiesTerms: `${LS_NAMESPACE}cookies_terms`,
  safeLabsTerms: `${LS_NAMESPACE}safeLabsTerms`,
  tokenList: `${LS_NAMESPACE}tokenList`,
} as const
