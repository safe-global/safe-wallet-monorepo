import { selectUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import { getUndeployedSafeInfo } from '@/features/counterfactual/utils'
import { useAppSelector } from '@/store'
import { useEffect, useMemo } from 'react'
import { getSafeInfo, type SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import useAsync, { type AsyncResult } from '../useAsync'
import useSafeAddress from '../useSafeAddress'
import { useChainId } from '../useChainId'
import useIntervalCounter from '../useIntervalCounter'
import useSafeInfo from '../useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import { POLLING_INTERVAL } from '@/config/constants'
import { useCurrentChain } from '../useChains'

export const useLoadSafeInfo = (): AsyncResult<SafeInfo> => {
  const address = useSafeAddress(true)
  const chainId = useChainId()
  const chain = useCurrentChain()
  const [pollCount, resetPolling] = useIntervalCounter(POLLING_INTERVAL)
  const { safe } = useSafeInfo()
  const isStoredSafeValid = safe.chainId === chainId && safe.address.value === address
  const cache = isStoredSafeValid ? safe : undefined
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, chainId, address))

  const [undeployedData, undeployedError] = useAsync<SafeInfo | undefined>(async () => {
    if (!undeployedSafe || !chain) return
    /**
     * This is the one place where we can't check for `safe.deployed` as we want to update that value
     * when the local storage is cleared, so we have to check undeployedSafe
     */
    return getUndeployedSafeInfo(undeployedSafe, address, chain)
  }, [undeployedSafe, address, chain])

  const [cgwData, cgwError, cgwLoading] = useAsync<SafeInfo | undefined>(async () => {
    if (!chainId || !address || pollCount === undefined) return
    const safeInfo = await getSafeInfo(chainId, address)
    return { ...safeInfo, deployed: true }
  }, [chainId, address, pollCount])

  // Reset the counter when safe address/chainId changes
  useEffect(() => {
    resetPolling()
  }, [resetPolling, address, chainId])

  // Log errors
  useEffect(() => {
    if (cgwError) {
      logError(Errors._600, cgwError.message)
    }
  }, [cgwError])

  // Return stored SafeInfo between polls
  const safeData = cgwData ?? undeployedData ?? cache
  const error = cgwError ?? (undeployedSafe ? undeployedError : undefined)
  const loading = cgwLoading

  return useMemo(() => [safeData, error, loading], [safeData, error, loading])
}

export default useLoadSafeInfo
