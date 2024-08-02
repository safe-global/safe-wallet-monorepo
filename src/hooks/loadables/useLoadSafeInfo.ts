import { selectUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import { getUndeployedSafeInfo } from '@/features/counterfactual/utils'
import { useAppSelector } from '@/store'
import { useEffect } from 'react'
import { getSafeInfo, type SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import useAsync, { type AsyncResult } from '../useAsync'
import useSafeAddress from '../useSafeAddress'
import { useChainId } from '../useChainId'
import useIntervalCounter from '../useIntervalCounter'
import useSafeInfo from '../useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import { POLLING_INTERVAL } from '@/config/constants'
import { CHAIN_ID } from '@/features/superChain/constants'

export const useLoadSafeInfo = (): AsyncResult<SafeInfo> => {
  const address = useSafeAddress()
  const chainId = CHAIN_ID
  const [pollCount, resetPolling] = useIntervalCounter(POLLING_INTERVAL)
  const { safe } = useSafeInfo()
  const isStoredSafeValid = safe.chainId === chainId && safe.address.value === address
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, chainId, address))

  const [data, error, loading] = useAsync<SafeInfo | undefined>(async () => {
    if (!chainId || !address) return

    /**
     * This is the one place where we can't check for `safe.deployed` as we want to update that value
     * when the local storage is cleared, so we have to check undeployedSafe
     */
    if (undeployedSafe) return getUndeployedSafeInfo(undeployedSafe.props, address, chainId)

    const safeInfo = await getSafeInfo(chainId, address)

    return { ...safeInfo, deployed: true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, address, pollCount, undeployedSafe])

  // Reset the counter when safe address/chainId changes
  useEffect(() => {
    resetPolling()
  }, [resetPolling, address, chainId])

  // Log errors
  useEffect(() => {
    if (error) {
      logError(Errors._600, error.message)
    }
  }, [error])

  return [
    // Return stored SafeInfo between polls
    data ?? (isStoredSafeValid ? safe : data),
    error,
    loading,
  ]
}

export default useLoadSafeInfo
