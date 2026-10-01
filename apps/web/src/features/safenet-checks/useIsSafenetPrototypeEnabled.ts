import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import chains from '@safe-global/utils/config/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const PROTOTYPE_CHAIN_IDS = [chains.eth, chains.gno]

/**
 * Gate for the mocked M1 Safenet checks prototype: the `SAFENET_CHECKS_PROTOTYPE` flag, on
 * Ethereum and Gnosis Chain only. Independent of `SAFENET_CHECKS`, which gates the real reads.
 */
export const useIsSafenetPrototypeEnabled = (): boolean => {
  const chainId = useCurrentChain()?.chainId
  const hasFeature = useHasFeature(FEATURES.SAFENET_CHECKS_PROTOTYPE) === true
  return hasFeature && !!chainId && PROTOTYPE_CHAIN_IDS.includes(chainId)
}
