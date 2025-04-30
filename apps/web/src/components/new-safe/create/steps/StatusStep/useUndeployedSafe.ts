import { selectUndeployedSafes } from '@/features/counterfactual/store/undeployedSafesSlice'
import useChainId from '@/hooks/useChainId'
import { useAppSelector } from '@/store'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'

// Returns the undeployed safe for the current network
const useUndeployedSafe = () => {
  const chainId = useChainId()
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const undeployedSafe =
    undeployedSafes[chainId] &&
    Object.entries(undeployedSafes[chainId]).find((undeployedSafe) => {
      return undeployedSafe[1].status.type === PayMethod.PayNow
    })

  return undeployedSafe || []
}

export default useUndeployedSafe
