// Vite-native replacement for apps/web/src/features/__core__/createFeatureHandle.ts.
// Aliased in vite.config.ts so that all `@/features/__core__/createFeatureHandle`
// imports resolve here. The original module uses template-literal dynamic
// imports (`import(\`../${folderName}/feature\`)`) which Vite cannot analyze;
// `import.meta.glob` builds a statically-analyzable lazy module map instead.
//
// The public API (signature, return shape) is identical to the original so
// that callers (every feature.ts file under apps/web/src/features/*/) work
// unchanged.

import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { FeatureHandle, FeatureImplementation } from '@/features/__core__/types'

const FEATURE_FLAG_MAPPING: Record<string, FEATURES> = {
  walletconnect: FEATURES.NATIVE_WALLETCONNECT,
  stake: FEATURES.STAKING,
  swap: FEATURES.NATIVE_SWAPS,
  multichain: FEATURES.MULTI_CHAIN_SAFE_CREATION,
  'no-fee-campaign': FEATURES.NO_FEE_NOVEMBER,
  speedup: FEATURES.SPEED_UP_TX,
  portfolio: FEATURES.PORTFOLIO_ENDPOINT,
  'targeted-outreach': FEATURES.TARGETED_SURVEY,
  myAccounts: FEATURES.MY_ACCOUNTS,
}

// Glob runs at build time and produces a map of every feature.ts under
// apps/web/src/features/<folder>/feature.{ts,tsx}. Lazy: each entry is a
// thunk that triggers the dynamic import only when called.
const featureModules = import.meta.glob<{ default: FeatureImplementation }>(
  '../../../web/src/features/*/feature.{ts,tsx}',
)

function resolveFeatureLoader<T extends FeatureImplementation>(folderName: string): () => Promise<{ default: T }> {
  const tsKey = `../../../web/src/features/${folderName}/feature.ts`
  const tsxKey = `../../../web/src/features/${folderName}/feature.tsx`
  const loader = (featureModules[tsKey] ?? featureModules[tsxKey]) as (() => Promise<{ default: T }>) | undefined
  if (!loader) {
    throw new Error(
      `createFeatureHandle: no feature module found for '${folderName}'. ` + `Expected ${tsKey} or ${tsxKey}.`,
    )
  }
  return loader
}

export function createFeatureHandle<T extends FeatureImplementation = FeatureImplementation>(
  folderName: string,
  featureFlag?: FEATURES,
): FeatureHandle<T> {
  const load = resolveFeatureLoader<T>(folderName)

  if (featureFlag !== undefined) {
    return { name: folderName, useIsEnabled: () => useHasFeature(featureFlag), load }
  }

  const mappedFlag = FEATURE_FLAG_MAPPING[folderName]
  if (mappedFlag !== undefined) {
    return { name: folderName, useIsEnabled: () => useHasFeature(mappedFlag), load }
  }

  const autoFlagName = folderName.toUpperCase().replace(/-/g, '_') as keyof typeof FEATURES
  const autoFlag = FEATURES[autoFlagName]
  if (autoFlag === undefined) {
    throw new Error(
      `Feature flag derivation failed for '${folderName}'. ` +
        `Expected FEATURES.${autoFlagName} to exist or be mapped in FEATURE_FLAG_MAPPING.`,
    )
  }
  return { name: folderName, useIsEnabled: () => useHasFeature(autoFlag), load }
}
