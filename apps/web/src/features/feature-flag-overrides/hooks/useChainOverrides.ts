import { useMemo } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useAppSelector } from '@/store'
import { selectFeatureFlagOverrides, type FeatureFlagOverridesState } from '@/features/feature-flag-overrides/store'

/**
 * The single production check governing override behaviour — overrides are dev-only.
 *
 * The inlined `process.env` access is substituted as a literal at parse time, so the bundler folds
 * every branch below and drops the override path from production builds. It is deliberately a
 * module-local const rather than an import of `IS_PRODUCTION` from `@/config/constants`: that const
 * behaves identically at runtime but relies on cross-module constant propagation, which is not
 * guaranteed, whereas same-module folding is. Keep the check here and nowhere else.
 */
const IS_PRODUCTION_BUILD = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'

/**
 * Applies local overrides to a chain's `features` array. Pure: whether overrides apply at all is
 * decided by the hooks below, not here.
 */
export const applyFeatureOverrides = (chain: Chain, overrides: FeatureFlagOverridesState): Chain => {
  const entries = Object.entries(overrides)
  if (entries.length === 0) return chain

  const features = new Set(chain.features)
  for (const [feature, value] of entries) {
    if (value) features.add(feature)
    else features.delete(feature)
  }
  return { ...chain, features: Array.from(features) }
}

/** Amends the chains from `useChains` with the local overrides. Identity in production. */
export const useChainsWithOverrides = (chains: Chain[]): Chain[] => {
  const overrides = useAppSelector(selectFeatureFlagOverrides)

  return useMemo(() => {
    if (IS_PRODUCTION_BUILD) return chains
    return chains.map((chain) => applyFeatureOverrides(chain, overrides))
  }, [chains, overrides])
}

/** Amends a single chain from `useChain` with the local overrides. Identity in production. */
export const useChainWithOverrides = (chain: Chain | undefined): Chain | undefined => {
  const overrides = useAppSelector(selectFeatureFlagOverrides)

  return useMemo(() => {
    if (IS_PRODUCTION_BUILD || !chain) return chain
    return applyFeatureOverrides(chain, overrides)
  }, [chain, overrides])
}
