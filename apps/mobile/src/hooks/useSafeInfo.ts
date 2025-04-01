import { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useGetSafeQuery } from '@safe-global/store/gateway'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'

export const useSafeInfo = () => {
  const activeSafe = useAppSelector(selectActiveSafe)

  const {
    data = {} as SafeState,
    error,
    isLoading,
  } = useGetSafeQuery(
    {
      chainId: activeSafe?.chainId ?? '',
      safeAddress: activeSafe?.address ?? '',
    },
    {
      skip: !activeSafe,
    },
  )

  if (!activeSafe) {
    return {
      safe: {} as SafeState,
      safeAddress: null,
      safeLoaded: false,
      safeError: null,
      safeLoading: false,
    }
  }
  return {
    safe: data,
    safeAddress: activeSafe.address,
    safeLoaded: !!data?.address,
    safeError: error,
    safeLoading: isLoading,
  }
}

export default useSafeInfo
