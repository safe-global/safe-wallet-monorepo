/**
 * Test constants — TypeScript port of cypress/support/constants.js
 *
 * Only the constants actively used in the initial smoke test migration are ported here.
 * More will be added as tests are migrated.
 */

// ── URLs / Routes ──────────────────────────────────────────────────────────────
export const welcomeUrl = '/welcome'
export const welcomeAccountsUrl = '/welcome/accounts'
export const homeUrl = '/home?safe='
export const BALANCE_URL = '/balances?safe='
export const balanceNftsUrl = '/balances/nfts?safe='
export const transactionQueueUrl = '/transactions/queue?safe='
export const transactionsHistoryUrl = '/transactions/history?safe='
export const swapUrl = '/swap?safe='
export const addressBookUrl = '/address-book?safe='
export const setupUrl = '/settings/setup?safe='
export const createNewSafeSepoliaUrl = '/new-safe/create?chain=sep'
export const loadNewSafeSepoliaUrl = '/new-safe/load?chain=sep'
export const prodbaseUrl = 'https://app.safe.global'

// ── API endpoint patterns (for route interception) ─────────────────────────────
export const chainsEndpoint = '**/v2/chains'
export const chainConfigEndpoint = '**/v2/chains/*'
export const safeInfoEndpoint = '**/v1/chains/*/safes/*'
export const balancesEndpoint = '**/v1/**/safes/**/balances/**'
export const portfolioEndpoint = '**/v1/portfolio/**'
export const positionsEndpoint = '**/v1/**/safes/**/positions/**'
export const queuedEndpoint = '**/queued*'
export const transactionHistoryEndpoint = '**/v1/**/transactions/history**'
export const appsEndpoint = '**/v1/**/safe-apps*'
export const collectiblesEndpoint = '**/collectibles*'
export const masterCopiesEndpoint = '**/v1/**/about/master-copies*'
export const targetedMessagingEndpoint = '**/v1/targeted-messaging/**'

// ── Staging API URLs ───────────────────────────────────────────────────────────
export const stagingCGWUrl = 'https://safe-client.staging.5afe.dev/'
export const stagingCGWUrlv1 = 'https://safe-client.staging.5afe.dev/v1'
export const stagingCGWUrlv2 = 'https://safe-client.staging.5afe.dev/v2'

// ── Test addresses ─────────────────────────────────────────────────────────────
export const RECIPIENT_ADDRESS = '0x6a5602335a878ADDCa4BF63a050E34946B56B5bC'
export const DEFAULT_OWNER_ADDRESS = '0xC16Db0251654C0a72E91B190d81eAD367d2C6fED'
export const SEPOLIA_OWNER_2 = '0x96D4c6fFC338912322813a77655fCC926b9A5aC5'
export const ENS_TEST_SEPOLIA = 'e2etestsafe.eth'

// ── Network keys ───────────────────────────────────────────────────────────────
export const networkKeys = {
  sepolia: '11155111',
  polygon: '137',
} as const

export const networks = {
  ethereum: 'Ethereum',
  sepolia: 'Sepolia',
  polygon: 'Polygon',
  gnosis: 'Gnosis',
} as const

// ── Token names ────────────────────────────────────────────────────────────────
export const tokenNames = {
  wrappedEther: 'Wrapped Ether',
  sepoliaEther: 'Sepolia Ether',
  qaToken: 'QAtest10',
  cow: 'CoW Protocol Token',
} as const

export const tokenAbbreviation = {
  sep: 'ETH',
  eth: 'ETH',
} as const

// ── LocalStorage keys ──────────────────────────────────────────────────────────
export const localStorageKeys = {
  SAFE_v2__addressBook: 'SAFE_v2__addressBook',
  SAFE_v2__batch: 'SAFE_v2__batch',
  SAFE_v2__settings: 'SAFE_v2__settings',
  SAFE_v2__addedSafes: 'SAFE_v2__addedSafes',
  SAFE_v2__safeApps: 'SAFE_v2__safeApps',
  SAFE_v2_cookies: 'SAFE_v2__cookies_terms',
  SAFE_v2__tokenlist_onboarding: 'SAFE_v2__tokenlist_onboarding',
  SAFE_v2__SafeApps__infoModal: 'SAFE_v2__SafeApps__infoModal',
  SAFE_v2__undeployedSafes: 'SAFE_v2__undeployedSafes',
  SAFE_v2__visitedSafes: 'SAFE_v2__visitedSafes',
  SAFE_v2__auth: 'SAFE_v2__auth',
} as const

// ── Visual regression ──────────────────────────────────────────────────────────
export const VISUAL_SETTLE_TIME = 7000
export const VISUAL_VIEWPORT = { width: 1920, height: 1080 } as const
