import type { RequestHandler } from 'msw'
import type { Decorator } from '@storybook/react'
import type { WalletContextType } from '@/components/common/WalletProvider'
import type { FixtureScenario } from '../../../../../config/test/msw/fixtures'

/**
 * Wallet preset identifiers for common wallet states
 */
export type WalletPreset = 'disconnected' | 'connected' | 'owner' | 'nonOwner'

/**
 * Layout wrapper options for stories
 */
export type LayoutType = 'none' | 'paper' | 'withSidebar' | 'fullPage'

/**
 * Feature flags that can be toggled in story configuration.
 *
 * IMPORTANT: Do not override these unless testing a specific disabled feature state.
 * The defaults (portfolio=true, positions=true, swaps=true) should be used for most stories.
 * Only specify a feature to disable it (e.g., `features: { swaps: false }`).
 */
export interface FeatureFlags {
  /** PORTFOLIO_ENDPOINT - aggregated portfolio data (default: true, don't override) */
  portfolio?: boolean
  /** POSITIONS - DeFi positions display (default: true, don't override) */
  positions?: boolean
  /** NATIVE_SWAPS - swap functionality (default: true, don't override) */
  swaps?: boolean
  /** RECOVERY - recovery module features (default: false) */
  recovery?: boolean
  /** HYPERNATIVE - security alerts (default: false) */
  hypernative?: boolean
  /** EARN - staking/yield features (default: false) */
  earn?: boolean
  /** SPACES - collaborative spaces (default: false) */
  spaces?: boolean
}

/**
 * Store slice overrides for customizing Redux state
 */
export interface StoreOverrides {
  txQueue?: object
  safeApps?: object
  safeInfo?: {
    data?: object
    loading?: boolean
    loaded?: boolean
  }
  settings?: object
  chains?: object
  auth?: object
  [key: string]: object | undefined
}

/**
 * Main configuration interface for createMockStory factory
 */
export interface MockStoryConfig {
  /**
   * Wallet state - preset name or custom WalletContextType
   * @default 'disconnected'
   */
  wallet?: WalletPreset | WalletContextType

  /**
   * Feature flags - controls which chain features are enabled
   * @default { portfolio: true, positions: true, swaps: true }
   */
  features?: FeatureFlags

  /**
   * Data scenario - maps to fixture data sets
   * @default 'efSafe'
   */
  scenario?: FixtureScenario

  /**
   * Layout wrapper for the story
   * @default 'none'
   */
  layout?: LayoutType

  /**
   * Redux store state overrides
   */
  store?: StoreOverrides

  /**
   * Additional MSW handlers (merged after default handlers)
   * Can override default handlers by matching the same routes
   */
  handlers?: RequestHandler[]

  /**
   * Custom pathname for router mock
   * @default '/home'
   */
  pathname?: string

  /**
   * Additional query parameters for router mock
   * Will be merged with the default safe query param
   */
  query?: Record<string, string>
}

/**
 * Return type of createMockStory factory
 */
export interface MockStoryResult {
  /** Decorator that wraps story with all required providers */
  decorator: Decorator
  /** MSW request handlers for the configured scenario */
  handlers: RequestHandler[]
  /** Initial Redux store state */
  initialState: object
  /** Router parameters for Next.js router mock */
  parameters: {
    nextjs: {
      router: {
        pathname: string
        query: { safe: string }
      }
    }
    msw: {
      handlers: RequestHandler[]
    }
  }
}
