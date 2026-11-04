import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { type SafeState, useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { POLLING_INTERVAL } from '@/config/constants'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import type { PolicyGuardTarget } from '../types'

type GuardedSafe = Pick<SafeState, 'chainId' | 'version' | 'guard' | 'txHistoryTag'> & { deployed?: boolean }

type UseGuardedSafeResult = {
  safe: GuardedSafe
  safeAddress: string
  safeLoaded: boolean
  safeLoading: boolean
  error?: Error
  refetch: () => void
}

/** The open Safe by default, or the target Safe fetched from CGW */
export const useGuardedSafe = (target?: PolicyGuardTarget): UseGuardedSafeResult => {
  const currentSafe = useSafeInfo()
  const targetQuery = useSafesGetSafeV1Query(target ?? skipToken, {
    pollingInterval: POLLING_INTERVAL,
    skipPollingIfUnfocused: true,
  })
  const currentSafeError = useMemo(
    () => (currentSafe.safeError ? new Error(currentSafe.safeError) : undefined),
    [currentSafe.safeError],
  )
  // CGW only serves deployed Safes, so a 404 means the target is counterfactual (not eligible), not an error
  const targetError = useMemo(() => {
    const error = targetQuery.error
    if (!error || ('status' in error && error.status === 404)) return undefined
    return new Error(getRtkQueryErrorMessage(error), { cause: error })
  }, [targetQuery.error])

  // `refetch()` throws on a query that never started, which is the case without a target
  const { refetch: refetchTarget, isUninitialized } = targetQuery
  const refetch = useCallback(() => {
    if (!isUninitialized) refetchTarget()
  }, [isUninitialized, refetchTarget])

  if (!target) {
    const { safe, safeAddress, safeLoaded, safeLoading } = currentSafe
    return {
      safe,
      safeAddress,
      safeLoaded,
      safeLoading,
      error: safeLoaded || safeLoading ? undefined : currentSafeError,
      refetch,
    }
  }

  const safeLoaded = !!targetQuery.currentData
  // A switch to another target keeps the previous `data`, so only `currentData` shows the new one is still loading
  const isSwitching = targetQuery.isFetching && !!targetQuery.data && !targetQuery.currentData && !targetQuery.error
  // isLoading covers only the first fetch, so a 404 or failing target doesn't flicker on every poll
  const safeLoading = targetQuery.isLoading || isSwitching
  return {
    safe: targetQuery.currentData ?? { chainId: target.chainId, version: null, guard: null, txHistoryTag: null },
    safeAddress: target.safeAddress,
    safeLoaded,
    safeLoading,
    error: safeLoaded || safeLoading ? undefined : targetError,
    refetch,
  }
}
