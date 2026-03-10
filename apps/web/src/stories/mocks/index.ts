/**
 * Story Mocking Utilities
 *
 * This module provides a unified API for creating Storybook stories with
 * realistic mock data and providers. The main entry point is `createMockStory`,
 * which handles all the boilerplate of setting up:
 *
 * - MSW request handlers for API mocking
 * - Redux store with realistic initial state
 * - Wallet context (connected/disconnected)
 * - Safe SDK mock
 * - TxModal context
 * - Layout wrappers
 *
 * @example
 * // In your story file
 * import { createMockStory } from '@/stories/mocks'
 *
 * const { decorator, handlers, parameters } = createMockStory({
 *   scenario: 'efSafe',
 *   wallet: 'connected',
 *   features: { portfolio: true, positions: true },
 * })
 *
 * const meta = {
 *   title: 'Pages/MyPage',
 *   component: MyPage,
 *   loaders: [mswLoader],
 *   parameters: { ...parameters, layout: 'fullscreen' },
 *   decorators: [decorator],
 * }
 *
 * @module stories/mocks
 */

// Main factory function
export { createMockStory, createMinimalDecorator } from './createMockStory'

// Types
export type { MockStoryConfig, MockStoryResult, WalletPreset, LayoutType, FeatureFlags, StoreOverrides } from './types'

// Context Provider (for custom composition)
export { MockContextProvider, MockSDKProvider, mockTxModalContext } from './MockContextProvider'

// Wallet utilities (for escape hatch)
export { disconnectedWallet, createConnectedWallet, createNonOwnerWallet, resolveWallet } from './wallets'

// Chain utilities (for escape hatch)
export { createChainData, createChainsPageData, DEFAULT_FEATURES } from './chains'

// Handler utilities (for escape hatch)
export {
  coreHandlers,
  safeInfoHandlers,
  balanceHandlers,
  portfolioHandlers,
  positionsHandlers,
  safeAppsHandlers,
  txQueueHandlers,
  masterCopiesHandlers,
  targetedMessagingHandlers,
  createHandlers,
  createMockPendingTransactions,
  getFixtureData,
} from './handlers'

// State utilities (for escape hatch)
export { createDefaultSettings, createSafeInfoState, createSafeAppsState, createInitialState } from './defaults'
