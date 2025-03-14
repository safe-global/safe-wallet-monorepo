import { HAS_SAFENET_FEATURE } from '@/config/constants'
import { useCurrentChain } from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@/utils/chains'

const useHasSafenetFeature = (): boolean | undefined => {
  const currentChain = useCurrentChain()

  if (HAS_SAFENET_FEATURE) {
    return true
  }

  const hasSafenetFeature = currentChain ? hasFeature(currentChain, FEATURES.SAFENET) : undefined
  return hasSafenetFeature
}

export default useHasSafenetFeature
