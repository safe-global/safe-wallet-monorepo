import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { usePositionsGetPositionsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

const usePositions = () => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const currency = useAppSelector(selectCurrency)

  const {
    data,
    error,
    isLoading,
    isFetching,
    refetch: rtqRefetch,
  } = usePositionsGetPositionsV1Query(
    { chainId, safeAddress, fiatCode: currency, refresh: true },
    {
      skip: !safeAddress || !chainId || !currency,
    },
  )

  return { data, error, isLoading, isFetching, refetch: rtqRefetch }
}

export default usePositions
