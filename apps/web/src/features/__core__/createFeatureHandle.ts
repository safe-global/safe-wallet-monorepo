import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { FeatureHandle, FeatureImplementation } from './types'

// Semantic mapping from folder names to feature flags
// This allows features to omit the second parameter when the flag name
// doesn't match the folder name convention
const FEATURE_FLAG_MAPPING: Record<string, FEATURES> = {
  walletconnect: FEATURES.NATIVE_WALLETCONNECT,
  stake: FEATURES.STAKING,
  swap: FEATURES.NATIVE_SWAPS,
  multichain: FEATURES.MULTI_CHAIN_SAFE_CREATION,
  speedup: FEATURES.SPEED_UP_TX,
  portfolio: FEATURES.PORTFOLIO_ENDPOINT,
  'targeted-outreach': FEATURES.TARGETED_SURVEY,
  myAccounts: FEATURES.MY_ACCOUNTS,
}

/**
 * Creates a feature handle from folder name conventions.
 *
 * This helper simplifies feature handle creation by auto-deriving feature flags
 * from folder names using semantic mapping or kebab-case → UPPER_SNAKE_CASE conversion.
 *
 * @param folderName - Kebab-case folder name (e.g., 'walletconnect', 'tx-notes', 'bridge')
 * @param enablement - Optional FEATURES enum value, or a custom enablement hook returning
 *                     `boolean | undefined`. If omitted, uses semantic mapping or auto-derives:
 *                      'walletconnect' → FEATURES.NATIVE_WALLETCONNECT (mapped)
 *                      'stake' → FEATURES.STAKING (mapped)
 *                      'bridge' → FEATURES.BRIDGE (auto-derived)
 *                      'tx-notes' → FEATURES.TX_NOTES (auto-derived)
 * @returns FeatureHandle for use with useLoadFeature()
 *
 * @example
 * ```typescript
 * // Uses semantic mapping
 * export const WalletConnectFeature = createFeatureHandle('walletconnect')
 * // → FEATURES.NATIVE_WALLETCONNECT
 *
 * // Uses auto-derivation
 * export const BridgeFeature = createFeatureHandle('bridge')
 * // → FEATURES.BRIDGE
 *
 * // Manual override for special cases
 * export const CustomFeature = createFeatureHandle('custom', FEATURES.CUSTOM_FLAG)
 *
 * // Custom enablement hook (e.g. derived from chain.relayer instead of a feature flag)
 * export const GTFFeature = createFeatureHandle('gtf', useIsUnlimitedRelay)
 * ```
 */
export function createFeatureHandle<T extends FeatureImplementation = FeatureImplementation>(
  folderName: string,
  enablement?: FEATURES | (() => boolean | undefined),
): FeatureHandle<T> {
  // 1a. Use a custom enablement hook if provided
  if (typeof enablement === 'function') {
    return {
      name: folderName,
      useIsEnabled: enablement,
      load: () => import(/* webpackMode: "lazy" */ `../${folderName}/feature`) as Promise<{ default: T }>,
    }
  }

  // 1b. Use explicit feature-flag override if provided
  const featureFlag = enablement
  if (featureFlag !== undefined) {
    return {
      name: folderName,
      useIsEnabled: () => useHasFeature(featureFlag),
      load: () => import(/* webpackMode: "lazy" */ `../${folderName}/feature`) as Promise<{ default: T }>,
    }
  }

  // 2. Try semantic mapping first
  const mappedFlag = FEATURE_FLAG_MAPPING[folderName]
  if (mappedFlag !== undefined) {
    return {
      name: folderName,
      useIsEnabled: () => useHasFeature(mappedFlag),
      load: () => import(/* webpackMode: "lazy" */ `../${folderName}/feature`) as Promise<{ default: T }>,
    }
  }

  // 3. Fall back to auto-derivation: kebab-case → UPPER_SNAKE_CASE
  const autoFlagName = folderName.toUpperCase().replace(/-/g, '_') as keyof typeof FEATURES
  const autoFlag = FEATURES[autoFlagName]

  if (autoFlag === undefined) {
    throw new Error(
      `Feature flag derivation failed for '${folderName}'. ` +
        `Expected FEATURES.${autoFlagName} to exist or be mapped in FEATURE_FLAG_MAPPING. ` +
        `Pass the feature flag explicitly as the second parameter: createFeatureHandle('${folderName}', FEATURES.YOUR_FLAG)`,
    )
  }

  return {
    name: folderName,
    useIsEnabled: () => useHasFeature(autoFlag),
    load: () => import(/* webpackMode: "lazy" */ `../${folderName}/feature`) as Promise<{ default: T }>,
  }
}
