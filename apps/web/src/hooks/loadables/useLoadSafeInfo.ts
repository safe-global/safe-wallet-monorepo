import { removeUndeployedSafe, selectUndeployedSafe } from '@/features/counterfactual/store'
import { CounterfactualFeature } from '@/features/counterfactual'
import { useLoadFeature } from '@/features/__core__'
import { useAppDispatch, useAppSelector } from '@/store'
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
import { isAuthenticated, selectCfSafeSynced, selectIsStoreHydrated } from '@/store/authSlice'

const useLoadSafeInfo = (): AsyncResult<ExtendedSafeInfo> => {
  const dispatch = useAppDispatch()
  const address = useSafeAddressFromUrl()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()
  const isStoredSafeValid = safe.chainId === chainId && safe.address.value === address
  const cache = isStoredSafeValid ? safe : undefined
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, chainId, address))
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const isHydrated = useAppSelector(selectIsStoreHydrated)
  const cfSynced = useAppSelector(selectCfSafeSynced)
  const { getUndeployedSafeInfo, $isReady } = useLoadFeature(CounterfactualFeature)

  // Wait for CF sync before reporting errors for safes not found on-chain.
  // Also wait while store is hydrating — we don't yet know if user is authenticated.
  const awaitingCfSync = !isHydrated || (isUserAuthenticated && !cfSynced)

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

  // Only 404s are suppressed during CF sync — real errors (500, network) must still surface.
  const isCgw404 = !!cgwError && 'status' in cgwError && cgwError.status === 404
  const suppressCgwError = awaitingCfSync && isCgw404

  // Log errors only when not suppressing (CF sync + 404) and no CF fallback
  useEffect(() => {
    if (cgwError && !suppressCgwError && !undeployedSafe) {
      logError(Errors._600, 'message' in cgwError ? String(cgwError.message) : 'Failed to load safe info')
    }
  }, [cgwError, suppressCgwError, undeployedSafe])

  // Self-heal: if the safe is deployed on-chain (backend returned SafeInfo) but a
  // counterfactual entry still exists locally, remove it. The listener propagates
  // the DELETE to the backend best-effort. Covers: tab closed mid-activation,
  // prior DELETE failed, stale entry synced from another member of a space.
  useEffect(() => {
    if (cgwData && undeployedSafe && chainId && address) {
      dispatch(removeUndeployedSafe({ chainId, address }))
    }
  }, [cgwData, undeployedSafe, chainId, address, dispatch])

  // Return stored SafeInfo between polls
  const safeData = cgwDataWithDeployed ?? undeployedData ?? cache
  // Convert RTK Query error to standard Error for AsyncResult compatibility
  const error = useMemo(() => {
    // Suppress only CGW 404 while waiting for CF sync, or when CF data exists in Redux
    if (cgwError && !suppressCgwError && !undeployedSafe) {
      const errorMessage =
        'message' in cgwError
          ? String(cgwError.message)
          : 'status' in cgwError
            ? `Error ${cgwError.status}`
            : 'Failed to load safe info'
      return new Error(errorMessage)
    }
    return undeployedSafe ? undeployedError : undefined
  }, [cgwError, undeployedSafe, undeployedError, suppressCgwError])

  // Only block on CF sync while we don't yet have on-chain data — a deployed
  // safe (cgwData truthy) shouldn't wait for the CF sync round-trip. Combined
  // with useCounterfactualSafeSync's bounded retry + always-settle behavior,
  // this also bounds the loading window when the CF endpoint 500s.
  const loading = cgwLoading || (!cgwData && awaitingCfSync)

  return useMemo(() => [safeData, error, loading], [safeData, error, loading])
}

export default useLoadSafeInfo
