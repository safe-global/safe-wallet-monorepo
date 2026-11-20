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

// Types
export type { MockStoryConfig, MockStoryResult, WalletPreset, LayoutType, FeatureFlags, StoreOverrides } from './types'

// Context Provider (for custom composition)

// Wallet utilities (for escape hatch)

// Chain utilities (for escape hatch)

// Handler utilities (for escape hatch)

// State utilities (for escape hatch)
