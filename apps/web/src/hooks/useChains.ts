import { useMemo } from 'react'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useGetChainsConfigQuery } from '@safe-global/store/gateway'
import { useChainId } from './useChainId'
import type { FEATURES } from '@safe-global/utils/utils/chains'
import { hasFeature } from '@safe-global/utils/utils/chains'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

const useChains = (): { configs: Chain[]; error?: string; loading?: boolean } => {
  const { data, error, isLoading } = useGetChainsConfigQuery()

  const configs = useMemo(() => {
    if (!data) {
      return []
    }
    // data is already EntityState with { ids: string[], entities: { [id: string]: Chain } }
   const chains = data.ids.map((id) => data.entities[id]!).filter(Boolean)
    return chains
  }, [data])

  const errorMessage = useMemo(() => {
    if (error) {
      const msg = getRtkQueryErrorMessage(error)
      console.error('[useChains] Query error:', msg, error)
      return msg
    }
    return undefined
  }, [error])

  return useMemo(
    () => ({
      configs,
      error: errorMessage,
      loading: isLoading,
    }),
    [configs, errorMessage, isLoading],
  )
}

export default useChains

export const useChain = (chainId: string): Chain | undefined => {
  const { data } = useGetChainsConfigQuery()

  return useMemo(() => {
    if (!data) return undefined
    // data.entities is a direct lookup by chainId
    return data.entities[chainId]
  }, [data, chainId])
}

export const useCurrentChain = (): Chain | undefined => {
  const chainId = useChainId()
  const chain = useChain(chainId)
  if (chainId && !chain) {
  }
  return chain
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
