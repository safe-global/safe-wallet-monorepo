import { IS_SAFENET_ENABLED } from '@/config/constants'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useGetSafenetConfigQuery } from '@/store/safenet'
import { sameAddress } from '@/utils/addresses'

const useIsSafenetEnabled = () => {
  if (!IS_SAFENET_ENABLED) {
    return false
  }
  
  const { safe } = useSafeInfo()
  const { data: safenetConfig } = useGetSafenetConfigQuery()

  return sameAddress(safe.guard?.value, safenetConfig?.guards[safe.chainId])
}

export default useIsSafenetEnabled
