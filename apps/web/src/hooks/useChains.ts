import { useMemo } from 'react'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import useChainId from './useChainId'
import type { FEATURES } from '@safe-global/utils/utils/chains'
import {
  hasFeature,
  isRelayingEnabled,
  isUnlimitedRelay,
  isNoFeeCampaign,
  isSafeCreationSponsored,
  isSafeTransactionSponsored,
} from '@safe-global/utils/utils/chains'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { CONFIG_SERVICE_KEY } from '@/config/constants'

const useChains = (): { configs: Chain[]; error?: string; loading?: boolean } => {
  const { data, error, isLoading } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)

  const configs = useMemo(() => {
    if (!data) return []
    // data is already EntityState with { ids: string[], entities: { [id: string]: Chain } }
    return data.ids.map((id) => data.entities[id]!)
  }, [data])

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

  return useMemo(() => {
    if (!data) return undefined
    // data.entities is a direct lookup by chainId
    return data.entities[chainId]
  }, [data, chainId])
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

/**
 * Relay/sponsorship checks for the current chain, derived from `chain.relayer`.
 * Return `undefined` while the chain config is still loading, mirroring `useHasFeature`.
 */
export const useIsRelayingEnabled = (): boolean | undefined => {
  const currentChain = useCurrentChain()
  return currentChain ? isRelayingEnabled(currentChain) : undefined
}

export const useIsUnlimitedRelay = (): boolean | undefined => {
  const currentChain = useCurrentChain()
  return currentChain ? isUnlimitedRelay(currentChain) : undefined
}

export const useIsNoFeeCampaign = (): boolean | undefined => {
  const currentChain = useCurrentChain()
  return currentChain ? isNoFeeCampaign(currentChain) : undefined
}

export const useIsSafeCreationSponsored = (): boolean | undefined => {
  const currentChain = useCurrentChain()
  return currentChain ? isSafeCreationSponsored(currentChain) : undefined
}

export const useIsSafeTransactionSponsored = (): boolean | undefined => {
  const currentChain = useCurrentChain()
  return currentChain ? isSafeTransactionSponsored(currentChain) : undefined
}
