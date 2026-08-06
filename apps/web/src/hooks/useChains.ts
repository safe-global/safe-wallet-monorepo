import { useMemo } from 'react'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import useChainId from './useChainId'
import { type FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { useChainsWithOverrides } from '@/features/feature-flag-overrides'

const useChains = (): { configs: Chain[]; error?: string; loading?: boolean } => {
  const { data, error, isLoading } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)

  const rawConfigs = useMemo(() => (data ? data.ids.map((id) => data.entities[id]!) : []), [data])
  const configs = useChainsWithOverrides(rawConfigs)

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

  const rawChain = data?.entities[chainId]
  const rawChains = useMemo(() => (rawChain ? [rawChain] : []), [rawChain])

  return useChainsWithOverrides(rawChains)[0]
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
