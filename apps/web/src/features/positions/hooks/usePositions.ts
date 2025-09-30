import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import {
  useLazyPositionsGetPositionsV1Query,
  usePositionsGetPositionsV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { useCallback } from 'react'

const usePositions = () => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const currency = useAppSelector(selectCurrency)
  const [triggerRefresh] = useLazyPositionsGetPositionsV1Query()

  const { currentData, error, isLoading } = usePositionsGetPositionsV1Query(
    { chainId, safeAddress, fiatCode: currency },
    {
      skip: !safeAddress || !chainId || !currency,
    },
  )

  const refetch = useCallback(() => {
    if (!safeAddress || !chainId || !currency) return Promise.resolve()
    return triggerRefresh({ chainId, safeAddress, fiatCode: currency, refresh: true }).unwrap()
  }, [safeAddress, chainId, currency, triggerRefresh])

  return { data: currentData, error, isLoading, refetch }
}

export default usePositions
