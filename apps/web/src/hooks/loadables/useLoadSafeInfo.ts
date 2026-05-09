import { selectUndeployedSafe } from '@/features/counterfactual/store'
import { CounterfactualFeature } from '@/features/counterfactual'
import { useLoadFeature } from '@/features/__core__'
import { useAppSelector } from '@/store'
import { useEffect, useMemo } from 'react'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useChainId from '../useChainId'
import useSafeInfo from '../useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import { POLLING_INTERVAL } from '@/config/constants'
import { useCurrentChain } from '../useChains'
import { useSafeAddressFromUrl } from '../useSafeAddressFromUrl'

const useLoadSafeInfo = (): AsyncResult<ExtendedSafeInfo> => {
  const address = useSafeAddressFromUrl()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()
  const isStoredSafeValid = safe.chainId === chainId && safe.address.value === address
  const cache = isStoredSafeValid ? safe : undefined
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, chainId, address))
  const { getUndeployedSafeInfo, $isReady } = useLoadFeature(CounterfactualFeature)

  const [undeployedData, undeployedError] = useAsync<ExtendedSafeInfo | undefined>(async () => {
    if (!undeployedSafe || !chain || !$isReady) return
    /**
     * This is the one place where we can't check for `safe.deployed` as we want to update that value
     * when the local storage is cleared, so we have to check undeployedSafe
     */
    return getUndeployedSafeInfo(undeployedSafe, address, chain)
  }, [undeployedSafe, address, chain, $isReady, getUndeployedSafeInfo])

  const {
    currentData: cgwData,
    error: cgwError,
    isLoading: cgwLoading,
  } = useSafesGetSafeV1Query(
    { chainId: chainId || '', safeAddress: address || '' },
    {
      skip: !chainId || !address,
      pollingInterval: POLLING_INTERVAL,
    },
  )

  const cgwDataWithDeployed = cgwData ? { ...cgwData, deployed: true } : undefined

  // Log errors
  useEffect(() => {
    if (cgwError) {
      logError(Errors._600, 'message' in cgwError ? String(cgwError.message) : 'Failed to load safe info')
    }
  }, [cgwError])

  // Return stored SafeInfo between polls
  const safeData = cgwDataWithDeployed ?? undeployedData ?? cache
  // Convert RTK Query error to standard Error for AsyncResult compatibility
  const error = useMemo(() => {
    if (cgwError) {
      const errorMessage =
        'message' in cgwError
          ? String(cgwError.message)
          : 'status' in cgwError
            ? `Error ${cgwError.status}`
            : 'Failed to load safe info'
      return new Error(errorMessage)
    }
    return undeployedSafe ? undeployedError : undefined
  }, [cgwError, undeployedSafe, undeployedError])

  const loading = cgwLoading

  return useMemo(() => [safeData, error, loading], [safeData, error, loading])
}

export default useLoadSafeInfo
