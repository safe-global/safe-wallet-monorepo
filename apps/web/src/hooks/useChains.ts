import { useMemo } from 'react'
import isEqual from 'lodash/isEqual'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { useAppSelector } from '@/store'
import { selectChainById, selectChains } from '@/store/chainsSlice'
import { useChainId } from './useChainId'
import type { FEATURES } from '@safe-global/utils/utils/chains'
import { hasFeature } from '@safe-global/utils/utils/chains'

const useChains = (): { configs: Chain[]; error?: string; loading?: boolean } => {
  const state = useAppSelector(selectChains, isEqual)

  return useMemo(
    () => ({
      configs: state.data,
      error: state.error,
      loading: state.loading,
    }),
    [state.data, state.error, state.loading],
  )
}

export default useChains

export const useChain = (chainId: string): Chain | undefined => {
  return useAppSelector((state) => selectChainById(state, chainId), isEqual)
}

export const useCurrentChain = (): Chain | undefined => {
  const chainId = useChainId()
  const chainInfo = useAppSelector((state) => selectChainById(state, chainId), isEqual)
  return chainInfo
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
