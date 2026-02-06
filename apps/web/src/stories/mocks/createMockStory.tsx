import React from 'react'
import type { Decorator, StoryContext } from '@storybook/react'
import { SAFE_ADDRESSES } from '../../../../../config/test/msw/fixtures'
import { MockContextProvider } from './MockContextProvider'
import { resolveWallet } from './wallets'
import { createHandlers, getFixtureData } from './handlers'
import { createInitialState } from './defaults'
import type { MockStoryConfig, MockStoryResult } from './types'

/**
 * Creates a complete mock story setup with decorator, handlers, and state
 *
 * NOTE: When changing the API or config options of this function,
 * also update the documentation in AGENTS.md (Storybook section).
 *
 * This is the main entry point for creating stories with mocked data.
 * It provides a single configuration object that handles:
 * - Wallet state (disconnected/connected/owner/custom)
 * - Feature flags (portfolio, positions, swaps, etc.) - DO NOT OVERRIDE unless testing disabled state
 * - Data scenarios (efSafe, vitalik, empty, etc.)
 * - Layout wrappers (none, paper, fullPage)
 * - Redux store state
 * - MSW request handlers
 *
 * IMPORTANT: Do not override feature flags unless testing a specific disabled feature.
 * The defaults (portfolio: true, positions: true, swaps: true) should be used for most stories.
 *
 * @param config - Story configuration options
 * @returns Object with decorator, handlers, initialState, and parameters
 *
 * @example
 * // Basic usage - default efSafe scenario with disconnected wallet
 * // Features are enabled by default, no need to specify them
 * const { decorator, handlers } = createMockStory()
 *
 * @example
 * // Connected wallet with full page layout
 * const { decorator, handlers, parameters } = createMockStory({
 *   wallet: 'connected',
 *   layout: 'fullPage',
 *   scenario: 'efSafe',
 * })
 *
 * @example
 * // Only disable features when testing specific disabled state
 * const { decorator, handlers } = createMockStory({
 *   scenario: 'efSafe',
 *   features: { swaps: false }, // Test UI without swap feature
 * })
 *
 * @example
 * // Custom handlers override
 * const { decorator, handlers } = createMockStory({
 *   scenario: 'efSafe',
 *   handlers: [
 *     http.get('/custom-endpoint', () => HttpResponse.json({ custom: true })),
 *   ],
 * })
 */
export function createMockStory(config: MockStoryConfig = {}): MockStoryResult {
  const {
    wallet: walletPreset = 'disconnected',
    features = {},
    scenario = 'efSafe',
    layout = 'none',
    store: storeOverrides = {},
    handlers: customHandlers = [],
    pathname = '/home',
    query: customQuery = {},
  } = config

  // Get fixture data for scenario
  const { safeData } = getFixtureData(scenario)

  // Get safe address info for router
  const safeAddressInfo = scenario === 'empty' ? SAFE_ADDRESSES.efSafe : SAFE_ADDRESSES[scenario]
  const safeAddress = safeAddressInfo.address

  // Determine if user should be authenticated (required for spaces)
  const isAuthenticated = features.spaces === true

  // Create all MSW handlers
  const handlers = createHandlers({
    scenario,
    features,
    handlers: customHandlers,
  })

  // Create decorator function
  const decorator: Decorator = (Story, context: StoryContext) => {
    const isDarkMode = context.globals?.theme === 'dark'

    // Resolve wallet context
    const wallet = resolveWallet(walletPreset, safeData)

    // Create initial store state
    const initialState = createInitialState({
      safeData,
      isDarkMode,
      overrides: storeOverrides,
      isAuthenticated,
    })

    return (
      <MockContextProvider
        wallet={wallet}
        initialState={initialState}
        context={context}
        layout={layout}
        pathname={pathname}
      >
        <Story />
      </MockContextProvider>
    )
  }

  // Create initial state for external use (without dark mode - will be set by decorator)
  const initialState = createInitialState({
    safeData,
    isDarkMode: false,
    overrides: storeOverrides,
    isAuthenticated,
  })

  // Create parameters object for Storybook
  const parameters = {
    nextjs: {
      router: {
        pathname,
        query: { safe: `eth:${safeAddress}`, ...customQuery },
      },
    },
    msw: {
      handlers,
    },
  }

  return {
    decorator,
    handlers,
    initialState,
    parameters,
  }
}

/**
 * Creates a minimal decorator without MSW handlers
 *
 * Useful for simple component stories that don't need API mocking,
 * but still need the provider context (Redux, Wallet, etc.)
 *
 * @param config - Story configuration options
 * @returns Decorator function only
 *
 * @example
 * const decorator = createMinimalDecorator({ layout: 'paper' })
 */
export function createMinimalDecorator(config: Omit<MockStoryConfig, 'handlers'> = {}): Decorator {
  return createMockStory(config).decorator
}
