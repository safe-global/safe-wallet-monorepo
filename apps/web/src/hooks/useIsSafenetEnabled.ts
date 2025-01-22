import { IS_SAFENET_ENABLED } from '@/config/constants'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useGetSafenetConfigQuery } from '@/store/safenet'
import { sameAddress } from '@/utils/addresses'

const useIsSafenetEnabled = () => {
  const { safe } = useSafeInfo()
  const { data: safenetConfig } = useGetSafenetConfigQuery()

  if (!IS_SAFENET_ENABLED) {
    return false
  }

  return sameAddress(safe.guard?.value, safenetConfig?.guards[safe.chainId])
}

export default useIsSafenetEnabled
