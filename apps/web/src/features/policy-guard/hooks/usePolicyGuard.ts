import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { useChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { getPolicyGuardAddress } from '../services/policyEngineDeployments'
import { isSafeEligibleForAllowlist } from '../services/allowlistAvailability'
import { resolvePolicyGuardState } from '../services/resolvePolicyGuardState'
import { useGetModuleGuardQuery } from '../store/moduleGuardApi'
import type { PolicyGuardState, PolicyGuardTarget } from '../types'
import { useGuardedSafe } from './useGuardedSafe'
import { useCappedReread } from './useCappedReread'

export type UsePolicyGuardResult = {
  state?: PolicyGuardState
  isLoading: boolean
  /** A failed read is being read again; `error` stays set until it settles. */
  isRetrying: boolean
  error?: Error
  refetch: () => void
}

/** Reads the open Safe by default; pass a target to read any other Safe */
export const usePolicyGuard = (target?: PolicyGuardTarget): UsePolicyGuardResult => {
  const { safe, safeAddress, safeLoaded, safeLoading, error: safeError, refetch: refetchSafe } = useGuardedSafe(target)
  const chain = useChain(safe.chainId)
  const policyGuardAddress = getPolicyGuardAddress(safe.chainId)
  const eligibility = isSafeEligibleForAllowlist(safe, chain)
  const isUnsupported = !eligibility.eligible && eligibility.reason === 'version-unsupported'
  const shouldRead = safeLoaded && eligibility.eligible

  // CGW Safe info has no module guard field yet, so it is read from the storage slot
  const customRpc = useAppSelector(selectRpc)[safe.chainId]
  const readArgs = shouldRead
    ? { chainId: safe.chainId, safeAddress, txHistoryTag: safe.txHistoryTag ?? '', customRpc }
    : undefined
  const moduleGuardQuery = useGetModuleGuardQuery(readArgs ?? skipToken)
  const moduleGuard = moduleGuardQuery.currentData
  // The last error stays during a retry, and a failed re-read doesn't hide a value already read
  const readError = moduleGuard ? undefined : (moduleGuardQuery.error as Error | undefined)

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
  const readKey = readArgs
    ? `${readArgs.chainId}:${readArgs.safeAddress}:${readArgs.txHistoryTag}:${customRpc ?? ''}`
    : ''
  useCappedReread(!!readError || state?.status === 'partial', readKey, moduleGuardQuery.refetch)

  const { refetch: refetchModuleGuard, isUninitialized: isModuleGuardUninitialized } = moduleGuardQuery
  const refetch = useCallback(() => {
    refetchSafe()
    if (!isModuleGuardUninitialized) refetchModuleGuard()
  }, [refetchSafe, isModuleGuardUninitialized, refetchModuleGuard])

  return {
    state,
    isLoading: safeLoading || (shouldRead && !moduleGuard && !readError),
    isRetrying: !!readError && moduleGuardQuery.isFetching,
    error: safeError ?? readError,
    refetch,
  }
}
