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
  /** 1/4 Safe holding ETH plus six $0 test tokens, OWNER_4 is an owner — for assets-table tests (mirrors Cypress SEP_STATIC_SAFE_2) */
  SEP_ASSETS_SAFE: 'sep:0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415',
  /** Safe with an executed transaction history — for tx history tests (mirrors Cypress SEP_STATIC_SAFE_7) */
  SEP_HISTORY_SAFE: 'sep:0x5912f6616c84024cD1aff0D5b55bb36F5180fFdb',
  /** Safe with queued transactions, two of them for one nonce — for the pending-transactions widget (mirrors Cypress SEP_STATIC_SAFE_2) */
  SEP_QUEUE_SAFE: 'sep:0xc2F3645bfd395516d1a18CA6ad9298299d328C01',
  /** Mainnet Safe that holds trusted and untrusted tokens — for the token lists (mirrors Cypress ETH_STATIC_SAFE_15) */
  ETH_TOKEN_LIST_SAFE: 'eth:0xfF501B324DC6d78dC9F983f140B9211c3EdB4dc7',
  /** Polygon Safe on an unsupported but known singleton, which can migrate in the app (mirrors Cypress MATIC_STATIC_SAFE_31) */
  MATIC_MIGRATABLE_SAFE: 'matic:0x0b268DC6D1DfF21CaEb161c7aF5cEc3093057082',
  /** Polygon Safe on an unofficial singleton, which only the CLI can migrate (mirrors Cypress MATIC_STATIC_SAFE_32) */
  MATIC_UNOFFICIAL_SINGLETON_SAFE: 'matic:0xc8D6C3f866597a63780fdEC4C4Cb08B5C19CDb60',
  /** Isolated stack only (no staging Safe): mainnet Safe whose tokens and positions the local Zerion lists */
  ETH_ZERION_SAFE: 'eth:0x0000000000000000000000000000000000000000',
  /** Isolated stack only (no staging Safe): mainnet Safe with the DeFi positions that the local Zerion lists */
  ETH_ZERION_POSITIONS_SAFE: 'eth:0x0000000000000000000000000000000000000000',
  /** Isolated stack only (no staging Safe): 3/3 Safe of the emulated Ledger with a transfer that needs its signature */
  SEP_LEDGER_SIGN_SAFE: 'sep:0x0000000000000000000000000000000000000000',
  /** Isolated stack only (no staging Safe): 1/1 Safe of the emulated Ledger with a signed transfer to execute */
  SEP_LEDGER_EXECUTE_SAFE: 'sep:0x0000000000000000000000000000000000000000',
} as const

/** The address of a prefixed Safe such as `sep:0x…` */
export const safeAddress = (prefixedSafe: string): string => prefixedSafe.split(':')[1]

/** Fiat value below which "Hide small balances" hides a token — mirrors DUST_THRESHOLD in src/config/constants.ts */
export const DUST_THRESHOLD_USD = 0.01

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
  // the Cypress spaces mocks use. `landingSpaceHint` is seeded to this so it resolves.
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
  /** Placeholder accounts, e.g. for a Workspace that holds more Safes than a plan allows */
  PLACEHOLDER_A: '0xa0000000000000000000000000000000000000a0',
  PLACEHOLDER_B: '0xb0000000000000000000000000000000000000b0',
} as const

// ---------------------------------------------------------------------------
// URL route patterns
// ---------------------------------------------------------------------------

export const ROUTES = {
  home: '/home',
  welcomeSpaces: '/welcome/spaces',
  spacesPolicies: '/spaces/policies',
  welcomeAccounts: '/welcome/accounts',
  balances: '/balances',
  balancesNfts: '/balances/nfts',
  transactions: '/transactions',
  transactionsQueue: '/transactions/queue',
  transactionsHistory: '/transactions/history',
  transactionsMessages: '/transactions/messages',
  settings: '/settings',
  settingsSetup: '/settings/setup',
  addressBook: '/address-book',
  apps: '/apps',
  loadSafe: '/new-safe/load',
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
