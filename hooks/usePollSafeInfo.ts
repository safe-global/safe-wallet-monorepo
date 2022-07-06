import { useEffect } from 'react'
import { getSafeInfo, SafeInfo } from '@gnosis.pm/safe-react-gateway-sdk'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSafeInfo, safeInfoSlice } from '@/store/safeInfoSlice'
import useSafeAddress from './useSafeAddress'
import { POLLING_INTERVAL } from '@/config/constants'
import useIntervalCounter from './useIntervalCounter'
import useAsync from './useAsync'
import { useChainId } from './useChainId'

// Poll & dispatch the Safe Info into the store
export const usePollSafeInfo = (): void => {
  const address = useSafeAddress()
  const chainId = useChainId()
  const [counter, resetCounter] = useIntervalCounter(POLLING_INTERVAL)
  const dispatch = useAppDispatch()

  const [data, error, loading] = useAsync<SafeInfo | undefined>(async () => {
    if (!chainId || !address) return
    return await getSafeInfo(chainId, address)
  }, [chainId, address, counter])

  // Reset the counter when safe address/chainId changes
  useEffect(() => {
    resetCounter()
  }, [dispatch, resetCounter, address, chainId])

  // Update the store when the Safe Info is fetched
  useEffect(() => {
    // Take errors and loading state into account only for initial requests when counter is 0
    if (data || counter === 0) {
      dispatch(safeInfoSlice.actions.set({ data, error: error?.message, loading }))
    }
  }, [dispatch, counter, data, error, loading])
}

const useSafeInfo = () => {
  const { data, error, loading } = useAppSelector(selectSafeInfo)
  return {
    safe: data,
    error,
    loading,
  }
}

export default useSafeInfo
