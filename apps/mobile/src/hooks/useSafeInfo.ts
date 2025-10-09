import { useGetSafeQuery } from '@safe-global/store/gateway'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { POLLING_INTERVAL } from '@/src/config/constants'

export const useSafeInfo = () => {
  const activeSafe = useAppSelector(selectActiveSafe)

  const {
    data = defaultSafeInfo,
    error,
    isLoading,
    isSuccess,
  } = useGetSafeQuery(
    {
      chainId: activeSafe?.chainId ?? '',
      safeAddress: activeSafe?.address ?? '',
    },
    {
      skip: !activeSafe,
      pollingInterval: POLLING_INTERVAL,
    },
  )

  return {
    safe: data,
    safeAddress: activeSafe?.address,
    safeLoaded: isSuccess,
    safeError: error,
    safeLoading: isLoading,
  }
}

export default useSafeInfo
