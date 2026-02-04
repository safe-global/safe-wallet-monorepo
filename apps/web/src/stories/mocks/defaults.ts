import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { QueuedItemPage, TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import type { StoreOverrides } from './types'
import { createMockPendingTransactions, createMockHistoryTransactions } from './handlers'

/**
 * Creates default settings state for stories
 *
 * @param isDarkMode - Whether dark mode is enabled
 * @returns Settings slice initial state
 */
export function createDefaultSettings(isDarkMode: boolean) {
  return {
    currency: 'usd',
    hiddenTokens: {},
    tokenList: TOKEN_LISTS.ALL,
    shortName: { copy: true, qr: true },
    theme: { darkMode: isDarkMode },
    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
    signing: { onChainSigning: false, blindSigning: false },
    transactionExecution: true,
  }
}

// Note: Chain data is loaded via RTK Query (gatewayApi), not a Redux slice.
// The createChainData function in chains.ts creates mock chain data that MSW
// handlers use to respond to /v1/chains/* API requests.

/**
 * Creates default safe info state
 *
 * @param safeData - Safe fixture data
 * @returns SafeInfo slice initial state
 */
export function createSafeInfoState(safeData: SafeState) {
  return {
    data: { ...safeData, deployed: true },
    loading: false,
    loaded: true,
  }
}

/**
 * Creates default safe apps state
 *
 * @returns SafeApps slice initial state
 */
export function createSafeAppsState() {
  return {
    pinned: [],
  }
}

/**
 * Creates default tx queue state with mock pending transactions
 *
 * @param safeData - Safe fixture data
 * @returns TxQueue slice initial state
 */
export function createTxQueueState(safeData: SafeState) {
  return {
    data: createMockPendingTransactions(safeData) as QueuedItemPage,
    loading: false,
    loaded: true,
  }
}

/**
 * Creates default tx history state with mock executed transactions
 *
 * @param safeData - Safe fixture data
 * @returns TxHistory slice initial state
 */
export function createTxHistoryState(safeData: SafeState) {
  return {
    data: createMockHistoryTransactions(safeData) as TransactionItemPage,
    loading: false,
    loaded: true,
  }
}

/**
 * Creates auth state for authenticated stories (needed for spaces)
 *
 * @param isAuthenticated - Whether the user should be authenticated
 * @returns Auth slice initial state
 */
export function createAuthState(isAuthenticated: boolean) {
  if (!isAuthenticated) {
    return {
      sessionExpiresAt: null,
      lastUsedSpaceId: null,
    }
  }
  // Set session to expire 1 hour from now
  return {
    sessionExpiresAt: Date.now() + 60 * 60 * 1000,
    lastUsedSpaceId: null,
  }
}

/**
 * Creates complete initial Redux store state for stories
 *
 * @param options - Configuration options
 * @returns Complete Redux store initial state
 *
 * @example
 * const state = createInitialState({
 *   safeData: safeFixtures.efSafe,
 *   chainData: createChainData(),
 *   isDarkMode: false,
 * })
 *
 * @example
 * const state = createInitialState({
 *   safeData: safeFixtures.vitalik,
 *   chainData: createChainData({ portfolio: true }),
 *   isDarkMode: true,
 *   overrides: { txQueue: mockTxQueueData },
 * })
 */
export function createInitialState(options: {
  safeData: SafeState
  isDarkMode: boolean
  overrides?: StoreOverrides
  isAuthenticated?: boolean
}) {
  const { safeData, isDarkMode, overrides = {}, isAuthenticated = false } = options

  // Build base state
  // Note: Chain data is loaded via RTK Query from MSW handlers, not preloaded
  const baseState = {
    settings: createDefaultSettings(isDarkMode),
    safeInfo: createSafeInfoState(safeData),
    safeApps: createSafeAppsState(),
    auth: createAuthState(isAuthenticated),
    txQueue: createTxQueueState(safeData),
    txHistory: createTxHistoryState(safeData),
  }

  // Merge overrides
  return {
    ...baseState,
    ...overrides,
    // Deep merge specific slices if provided in overrides
    settings: overrides.settings ? { ...baseState.settings, ...overrides.settings } : baseState.settings,
    safeInfo: overrides.safeInfo
      ? {
          ...baseState.safeInfo,
          ...overrides.safeInfo,
          // Deep merge data to allow partial overrides like { deployed: false }
          data: overrides.safeInfo.data
            ? { ...baseState.safeInfo.data, ...overrides.safeInfo.data }
            : baseState.safeInfo.data,
        }
      : baseState.safeInfo,
    safeApps: overrides.safeApps ? { ...baseState.safeApps, ...overrides.safeApps } : baseState.safeApps,
    auth: overrides.auth ? { ...baseState.auth, ...overrides.auth } : baseState.auth,
  }
}
