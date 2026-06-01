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
// Static test Safes — moved to dedicated registry
// Import from: import { staticSafes } from '../data/safes'
// See: src/data/safes/static.ts for full lookup table and AI selection guide
// ---------------------------------------------------------------------------

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
