import { chainFixtures } from '../../../../../config/test/msw/fixtures'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { FeatureFlags } from './types'

/**
 * Default feature flags for stories.
 * These match typical production usage and should NOT be overridden in most stories.
 * Only override a feature to test a specific disabled state (e.g., `features: { swaps: false }`).
 */
export const DEFAULT_FEATURES: Required<FeatureFlags> = {
  portfolio: true,
  positions: true,
  swaps: true,
  recovery: false,
  hypernative: false,
  earn: false,
  spaces: false,
}

/**
 * Mapping of FeatureFlags keys to chain feature strings
 */
const FEATURE_MAP: Record<keyof FeatureFlags, string> = {
  portfolio: 'PORTFOLIO_ENDPOINT',
  positions: 'POSITIONS',
  swaps: 'NATIVE_SWAPS',
  recovery: 'RECOVERY',
  hypernative: 'HYPERNATIVE',
  earn: 'EARN',
  spaces: 'SPACES',
}

/**
 * Features that are always disabled in stories (require complex mocking)
 */
const ALWAYS_DISABLED_FEATURES = ['EURCV_BOOST', 'NO_FEE_CAMPAIGN']

/**
 * Creates chain data with specified features enabled/disabled
 *
 * @param features - Feature flags to apply (merged with DEFAULT_FEATURES)
 * @param baseChain - Base chain fixture to modify (default: mainnet)
 * @returns Modified chain data with features applied
 *
 * @example
 * // Create chain with default features (portfolio + positions enabled)
 * const chain = createChainData()
 *
 * @example
 * // Create chain with only swaps (no portfolio/positions)
 * const chain = createChainData({ portfolio: false, positions: false })
 *
 * @example
 * // Create chain with recovery enabled
 * const chain = createChainData({ recovery: true })
 */
export function createChainData(features: FeatureFlags = {}, baseChain: Chain = chainFixtures.mainnet): Chain {
  const mergedFeatures = { ...DEFAULT_FEATURES, ...features }
  const chainData = { ...baseChain }

  // Build list of features to keep
  const enabledFeatureStrings = Object.entries(mergedFeatures)
    .filter(([, enabled]) => enabled)
    .map(([key]) => FEATURE_MAP[key as keyof FeatureFlags])
    .filter(Boolean)

  // Filter chain features: keep enabled ones and remove always-disabled ones
  chainData.features = chainData.features.filter((f: string) => {
    // Always remove complex features
    if (ALWAYS_DISABLED_FEATURES.includes(f)) return false

    // Check if this feature is in our map
    const configKey = Object.entries(FEATURE_MAP).find(([, value]) => value === f)?.[0]
    if (configKey) {
      // If it's a mapped feature, only keep if enabled
      return enabledFeatureStrings.includes(f)
    }

    // Keep other features that aren't in our map (like SAFE_141, etc.)
    return true
  })

  // Add any enabled features that might not be in the original chain
  enabledFeatureStrings.forEach((feature) => {
    if (!chainData.features.includes(feature)) {
      chainData.features.push(feature)
    }
  })

  return chainData
}

/**
 * Get all chains page response with modified chain data
 */
export function createChainsPageData(chainData: Chain) {
  return {
    ...chainFixtures.all,
    results: [chainData],
  }
}
