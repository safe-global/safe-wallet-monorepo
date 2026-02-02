import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import type { StoreOverrides } from './types'

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

/**
 * Creates default chains state
 *
 * @param chainData - Chain configuration data
 * @returns Chains slice initial state
 */
export function createChainsState(chainData: Chain) {
  return {
    data: [chainData],
    loading: false,
  }
}

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
  chainData: Chain
  isDarkMode: boolean
  overrides?: StoreOverrides
  isAuthenticated?: boolean
}) {
  const { safeData, chainData, isDarkMode, overrides = {}, isAuthenticated = false } = options

  // Build base state
  const baseState = {
    settings: createDefaultSettings(isDarkMode),
    chains: createChainsState(chainData),
    safeInfo: createSafeInfoState(safeData),
    safeApps: createSafeAppsState(),
    auth: createAuthState(isAuthenticated),
  }

  // Merge overrides
  return {
    ...baseState,
    ...overrides,
    // Deep merge specific slices if provided in overrides
    settings: overrides.settings ? { ...baseState.settings, ...overrides.settings } : baseState.settings,
    chains: overrides.chains ? { ...baseState.chains, ...overrides.chains } : baseState.chains,
    safeInfo: overrides.safeInfo ? { ...baseState.safeInfo, ...overrides.safeInfo } : baseState.safeInfo,
    safeApps: overrides.safeApps ? { ...baseState.safeApps, ...overrides.safeApps } : baseState.safeApps,
    auth: overrides.auth ? { ...baseState.auth, ...overrides.auth } : baseState.auth,
  }
}
