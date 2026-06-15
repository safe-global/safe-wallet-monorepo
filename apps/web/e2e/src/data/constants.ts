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
  /** Safe owned by OWNER_4 — for tx-creation flows needing a connected owner (mirrors Cypress SEP_STATIC_SAFE_6) */
  SEP_OWNER_4_SAFE: 'sep:0xBf30F749FC027a5d79c4710D988F0D3C8e217A4F',
} as const

// ---------------------------------------------------------------------------
// Address book seed data (for tests that seed a local contact via localStorage)
// ---------------------------------------------------------------------------

/** Deterministic local address-book contact to select in the recipient dropdown */
export const AB_LOCAL_CONTACT = {
  name: 'E2E Vitalik',
  address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
} as const

/**
 * Mixed contacts for the recipient-dropdown property tests.
 * - Local contacts are seeded via localStorage (CI starts with an empty browser).
 * - Workspace contacts are injected by mocking the spaces address-book API.
 * Addresses are distinct and DIGIT-ONLY (no a–f), so they are checksum-neutral:
 * the value selected from the dropdown matches the address-book key regardless of
 * checksum casing, so the read-only "selected" chip always renders.
 */
export const DROPDOWN_TEST_SPACE = {
  // Legacy numeric space id — accepted by the backend's LegacySpaceIdPipe and what
  // the Cypress spaces mocks use. `lastUsedSpace` is seeded to this so it resolves.
  id: '1',
  name: 'E2E Workspace',
} as const

export const DROPDOWN_LOCAL_CONTACTS = [
  { name: 'E2E Local One', address: '0x1111111111111111111111111111111111111111' },
  { name: 'E2E Local Two', address: '0x2222222222222222222222222222222222222222' },
  { name: 'E2E Local Three', address: '0x3333333333333333333333333333333333333333' },
  { name: 'E2E Local Four', address: '0x7777777777777777777777777777777777777777' },
  { name: 'E2E Local Five', address: '0x8888888888888888888888888888888888888888' },
] as const

export const DROPDOWN_WORKSPACE_CONTACTS = [
  { name: 'E2E Workspace Alice', address: '0x4444444444444444444444444444444444444444' },
  { name: 'E2E Workspace Bob', address: '0x5555555555555555555555555555555555555555' },
  { name: 'E2E Workspace Carol', address: '0x6666666666666666666666666666666666666666' },
  { name: 'E2E Workspace Dave', address: '0x9999999999999999999999999999999999999999' },
  { name: 'E2E Workspace Erin', address: '0x1212121212121212121212121212121212121212' },
] as const

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
