import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'
import { isSafeEligibleForAllowlist } from '../services/allowlistAvailability'
import { resolvePolicyGuardState } from '../../services/resolvePolicyGuardState'
import { useGetGuardSlotsQuery } from '../../store/guardSlotsApi'
import type { PolicyGuardState, PolicyGuardTarget } from '../types'
import { useGuardedSafe } from '../../hooks/useGuardedSafe'
import { useCappedReread } from '../../hooks/useCappedReread'

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
  const eligibility = isSafeEligibleForAllowlist(safe, chain)
  const isUnsupported = !eligibility.eligible && eligibility.reason === 'version-unsupported'
  const shouldRead = safeLoaded && eligibility.eligible

  // Both guards come from their storage slots in one read; CGW's Safe info can still lag behind a setup
  const customRpc = useAppSelector(selectRpc)[safe.chainId]
  const readArgs = shouldRead
    ? { chainId: safe.chainId, safeAddress, txHistoryTag: safe.txHistoryTag ?? '', customRpc }
    : undefined
  const guardSlotsQuery = useGetGuardSlotsQuery(readArgs ?? skipToken)
  const guardSlots = guardSlotsQuery.currentData
  // The last error stays during a retry, and a failed re-read doesn't hide a value already read
  const readError = guardSlots ? undefined : (guardSlotsQuery.error as Error | undefined)

  const state = useMemo((): PolicyGuardState | undefined => {
    if (!safeLoaded) return
    if (isUnsupported) return { status: 'unsupported' }
    if (!guardSlots) return
    return resolvePolicyGuardState({ ...guardSlots, chainId: safe.chainId })
  }, [safeLoaded, isUnsupported, guardSlots, safe.chainId])

  // A partial result may come from an RPC node a block behind the setup transaction
  const readKey = readArgs
    ? `${readArgs.chainId}:${readArgs.safeAddress}:${readArgs.txHistoryTag}:${customRpc ?? ''}`
    : ''
  useCappedReread(!!readError || state?.status === 'partial', readKey, guardSlotsQuery.refetch)

  const { refetch: refetchGuardSlots, isUninitialized: isGuardSlotsUninitialized } = guardSlotsQuery
  const refetch = useCallback(() => {
    refetchSafe()
    if (!isGuardSlotsUninitialized) refetchGuardSlots()
  }, [refetchSafe, isGuardSlotsUninitialized, refetchGuardSlots])

  return {
    state,
    isLoading: safeLoading || (shouldRead && !guardSlots && !readError),
    isRetrying: !!readError && guardSlotsQuery.isFetching,
    error: safeError ?? readError,
    refetch,
  }
}
