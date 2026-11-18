import { selectIsUndeployedSafe } from './undeployedSafesSlice'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'

const useIsCounterfactualSafe = () => {
  const {
    safeAddress,
    safe: { chainId },
  } = useSafeInfo()
  return useAppSelector((state) => selectIsUndeployedSafe(state, chainId, safeAddress))
}

export default useIsCounterfactualSafe
