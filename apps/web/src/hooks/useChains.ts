import { useMemo } from 'react'
import { type Chain, useChainsGetChainsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useChainId } from './useChainId'
import type { FEATURES } from '@safe-global/utils/utils/chains'
import { hasFeature } from '@safe-global/utils/utils/chains'

const useChains = (): { configs: Chain[]; error?: string; loading?: boolean } => {
  const { currentData, error, isLoading } = useChainsGetChainsV1Query({})

  return useMemo(
    () => ({
      configs: currentData?.results || [],
      error: error ? (error as any).error || 'Failed to load chains' : undefined,
      loading: isLoading,
    }),
    [currentData, error, isLoading],
  )
}

export default useChains

export const useChain = (chainId: string): Chain | undefined => {
  const { configs } = useChains()
  return useMemo(() => configs.find((chain) => chain.chainId === chainId), [configs, chainId])
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
