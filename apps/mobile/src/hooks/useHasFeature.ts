import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'

export const useHasFeature = (feature: FEATURES): boolean | undefined => {
  const chain = useAppSelector(selectActiveChain)
  return chain ? hasFeature(chain, feature) : undefined
}
