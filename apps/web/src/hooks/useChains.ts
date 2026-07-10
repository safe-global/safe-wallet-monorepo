import { useMemo } from 'react'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import useChainId from './useChainId'
import { type FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { useAppSelector } from '@/store'
import { selectFeatureFlagOverrides, type FeatureFlagOverridesState } from '@/features/feature-flags/store'

/**
 * Applies local, dev-only feature-flag overrides to a chain's `features` array.
 * Hard no-op in production — the inlined env check lets the bundler fold the
 * override logic out of production builds (do NOT swap for the imported
 * IS_PRODUCTION const; cross-module constant propagation is not guaranteed).
 */
export const applyFeatureOverrides = (chain: Chain, overrides: FeatureFlagOverridesState): Chain => {
  if (process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true' || Object.keys(overrides).length === 0) return chain

  const features = new Set(chain.features as string[])
  for (const [feature, value] of Object.entries(overrides)) {
    if (value) features.add(feature)
    else features.delete(feature)
  }
  return { ...chain, features: Array.from(features) as Chain['features'] }
}

const useChains = (): { configs: Chain[]; error?: string; loading?: boolean } => {
  const { data, error, isLoading } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)
  const overrides = useAppSelector(selectFeatureFlagOverrides)

  const configs = useMemo(() => {
    if (!data) return []
    return data.ids.map((id) => applyFeatureOverrides(data.entities[id]!, overrides))
  }, [data, overrides])

  return useMemo(
    () => ({
      configs,
      error: error ? getRtkQueryErrorMessage(error) : undefined,
      loading: isLoading,
    }),
    [configs, error, isLoading],
  )
}

export default useChains

export const useChain = (chainId: string): Chain | undefined => {
  const { data } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)
  const overrides = useAppSelector(selectFeatureFlagOverrides)

  return useMemo(() => {
    if (!data) return undefined
    const chain = data.entities[chainId]
    return chain ? applyFeatureOverrides(chain, overrides) : undefined
  }, [data, chainId, overrides])
}

export const useCurrentChain = (): Chain | undefined => {
  const chainId = useChainId()
  return useChain(chainId)
}

/**
 * Checks if a feature is enabled on the current chain.
 *
 * @param feature name of the feature to check for
 * @returns `true`, if the feature is enabled on the current chain. Otherwise `false`
 */
export const useHasFeature = (feature: FEATURES): boolean | undefined => {
  const currentChain = useCurrentChain()
  return currentChain ? hasFeature(currentChain, feature) : undefined
}
