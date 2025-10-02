import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { usePositionsGetPositionsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { useCallback, useState } from 'react'

const usePositions = () => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const currency = useAppSelector(selectCurrency)
  const [shouldRefresh, setShouldRefresh] = useState(false)

  const { data, error, isLoading, isFetching, refetch: rtqRefetch } = usePositionsGetPositionsV1Query(
    { chainId, safeAddress, fiatCode: currency, refresh: shouldRefresh },
    {
      skip: !safeAddress || !chainId || !currency,
    },
  )


  const refetch = useCallback(async () => {
    if (!safeAddress || !chainId || !currency) return Promise.resolve()

    if (!shouldRefresh) {
      // First click: just set the flag, which will change the query params and trigger a refetch
      setShouldRefresh(true)
      return Promise.resolve()
    }

    // Second click onwards: trigger refetch with refresh=true already set
    const result = await rtqRefetch().unwrap()
    return result
  }, [safeAddress, chainId, currency, shouldRefresh, rtqRefetch])

  return { data, error, isLoading: isLoading || isFetching, refetch }
}

export default usePositions
