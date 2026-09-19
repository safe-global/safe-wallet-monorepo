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
      // Stops a backgrounded tab on a failing Safe from polling (and reporting) forever. Paired with
      // refetchOnFocus so pausing costs no freshness — else returning could show a stale nonce/owners/
      // threshold for up to a polling interval.
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    },
  )

  // Stable reference when cgwData is unchanged. Without it a fresh object each render feeds
  // safeData → useMemo deps → useUpdateStore → re-dispatch → re-render, a loop that fired ~50
  // `safeInfo/set` (~1300 total actions) during one navigation.
  const cgwDataWithDeployed = useMemo(() => (cgwData ? { ...cgwData, deployed: true } : undefined), [cgwData])

  // Only 404s are suppressed during CF sync — real errors (500, network) must still surface.
  const isCgw404 = !!cgwError && 'status' in cgwError && cgwError.status === 404
  const suppressCgwError = awaitingCfSync && isCgw404

  // Self-heal: safe deployed on-chain but a counterfactual entry lingers locally → remove it (the
  // listener DELETEs to the backend best-effort). Covers tab-closed-mid-activation, a failed prior
  // DELETE, or a stale entry synced from another space member.
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

  // Only block on CF sync until on-chain data arrives (a deployed safe shouldn't wait for it). With
  // useCounterfactualSafeSync's bounded retry + always-settle, this bounds the loading window if CF 500s.
  const loading = cgwLoading || (!cgwData && awaitingCfSync)

  return useMemo(() => [safeData, error, loading], [safeData, error, loading])
}

export default useLoadSafeInfo
