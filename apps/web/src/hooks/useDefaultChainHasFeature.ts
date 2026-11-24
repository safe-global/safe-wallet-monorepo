import { type FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useChain } from '@/hooks/useChains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'

/** For flows that run before a chain is picked, such as the Workspace onboarding; undefined while the chain loads. */
export const useDefaultChainHasFeature = (feature: FEATURES): boolean | undefined => {
  const chain = useChain(String(DEFAULT_CHAIN_ID))
  if (!chain) {
    return undefined
  }
  return hasFeature(chain, feature)
}
