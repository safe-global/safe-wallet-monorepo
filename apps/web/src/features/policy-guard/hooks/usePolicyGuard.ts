import { useEffect, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { type SafeState, useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { POLLING_INTERVAL } from '@/config/constants'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useChain } from '@/hooks/useChains'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { getPolicyGuardAddress } from '../services/policyEngineDeployments'
import { isSafeEligibleForAllowlist } from '../services/allowlistAvailability'
import { resolvePolicyGuardState } from '../services/resolvePolicyGuardState'
import { useGetModuleGuardQuery } from '../store/moduleGuardApi'
import type { PolicyGuardState } from '../types'

type GuardedSafe = Pick<SafeState, 'chainId' | 'version' | 'guard' | 'txHistoryTag'> & { deployed?: boolean }

export type UsePolicyGuardResult = { state?: PolicyGuardState; isLoading: boolean; error?: Error }

export type PolicyGuardTarget = { chainId: string; safeAddress: string }

/** Reads the open Safe by default; pass a target to read any other Safe */
export const usePolicyGuard = (target?: PolicyGuardTarget): UsePolicyGuardResult => {
  const currentSafe = useSafeInfo()
  const targetQuery = useSafesGetSafeV1Query(target ?? skipToken, { pollingInterval: POLLING_INTERVAL })
  const currentSafeError = useMemo(
    () => (currentSafe.safeError ? new Error(currentSafe.safeError) : undefined),
    [currentSafe.safeError],
  )
  const targetError = useMemo(
    () =>
      targetQuery.error
        ? new Error(getRtkQueryErrorMessage(targetQuery.error), { cause: targetQuery.error })
        : undefined,
    [targetQuery.error],
  )

  const {
    safe,
    safeAddress,
    safeLoaded,
    safeLoading,
  }: { safe: GuardedSafe; safeAddress: string; safeLoaded: boolean; safeLoading: boolean } = target
    ? {
        safe: targetQuery.currentData ?? { chainId: target.chainId, version: null, guard: null, txHistoryTag: null },
        safeAddress: target.safeAddress,
        safeLoaded: !!targetQuery.currentData,
        safeLoading: !targetQuery.currentData && targetQuery.isFetching,
      }
    : currentSafe
  const chain = useChain(safe.chainId)
  const policyGuardAddress = getPolicyGuardAddress(safe.chainId)
  const eligibility = isSafeEligibleForAllowlist(safe, chain)
  const isUnsupported = !eligibility.eligible && eligibility.reason === 'version-unsupported'
  const shouldRead = safeLoaded && eligibility.eligible

  // CGW Safe info has no module guard field yet, so it is read from the storage slot
  const moduleGuardQuery = useGetModuleGuardQuery(
    shouldRead ? { chainId: safe.chainId, safeAddress, txHistoryTag: safe.txHistoryTag ?? '' } : skipToken,
  )
  const moduleGuard = moduleGuardQuery.currentData
  const readError = moduleGuardQuery.isError ? (moduleGuardQuery.error as Error) : undefined

  const state = useMemo((): PolicyGuardState | undefined => {
    if (!safeLoaded) return
    if (isUnsupported) return { status: 'unsupported' }
    if (!moduleGuard || !policyGuardAddress) return
    return resolvePolicyGuardState({
      txGuard: safe.guard?.value ?? ZERO_ADDRESS,
      moduleGuard,
      policyGuardAddress,
    })
  }, [safeLoaded, isUnsupported, moduleGuard, policyGuardAddress, safe.guard])

  // A partial result may come from an RPC node a block behind the setup transaction
  const shouldRetry = !!readError || state?.status === 'partial'
  const { refetch, requestId } = moduleGuardQuery
  useEffect(() => {
    if (!shouldRetry) return
    const timer = setTimeout(refetch, POLLING_INTERVAL)
    return () => clearTimeout(timer)
  }, [shouldRetry, refetch, requestId])

  const safeError = !safeLoaded && !safeLoading ? (target ? targetError : currentSafeError) : undefined

  return {
    state,
    isLoading: safeLoading || (shouldRead && !moduleGuard && !readError),
    error: safeError ?? readError,
  }
}
