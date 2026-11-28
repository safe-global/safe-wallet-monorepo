import { useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectSafeInfo } from '@/store/safeInfoSlice'
import { selectRpc } from '@/store/settingsSlice'
import { spendingLimitsApi, toSpendingLimitsArgs, useGetSpendingLimitsQuery } from '../../store/spendingLimitsApi'
import type { SpendingLimitState } from '../types'

const NO_SPENDING_LIMITS: SpendingLimitState[] = []

/** A failed read waits for no transaction: it is read again on this interval until it succeeds. */
export const SPENDING_LIMITS_RETRY_MS = 30_000

export type UseSafeSpendingLimitsResult = {
  /** Undefined until read, and while there is no Safe or the SPENDING_LIMIT flag is off. */
  spendingLimits?: SpendingLimitState[]
  loading: boolean
  error?: Error
}

type UseSafeSpendingLimitsOptions = {
  /** Reads the chain again on mount and hides a read from before it, for a caller that builds a transaction. */
  refetchOnMount?: boolean
}

/** The spending limits of the given Safe, read from the chain once and shared by every caller. */
export const useSafeSpendingLimits = (
  safe: ExtendedSafeInfo | undefined,
  { refetchOnMount = false }: UseSafeSpendingLimitsOptions = {},
): UseSafeSpendingLimitsResult => {
  const isEnabled = useHasFeature(FEATURES.SPENDING_LIMIT) === true
  const customRpcs = useAppSelector(selectRpc)
  const args = isEnabled && safe ? toSpendingLimitsArgs(safe, customRpcs) : skipToken
  const { isError } = spendingLimitsApi.endpoints.getSpendingLimits.useQueryState(args)
  const [mountedAt] = useState(Date.now)
  const { currentData, isFetching, error, fulfilledTimeStamp } = useGetSpendingLimitsQuery(args, {
    pollingInterval: isError ? SPENDING_LIMITS_RETRY_MS : 0,
    refetchOnMountOrArgChange: refetchOnMount,
  })
  const isReadSinceMount = (fulfilledTimeStamp ?? 0) >= mountedAt
  const spendingLimits = refetchOnMount && !isReadSinceMount ? undefined : currentData

  return {
    spendingLimits,
    loading: !spendingLimits && isFetching,
    error: !spendingLimits && error ? asError(error) : undefined,
  }
}

export type UseSpendingLimitsResult = {
  spendingLimits: SpendingLimitState[]
  loading: boolean
}

/** The spending limits of the Safe in the URL, also inside a Space flow: unlike useSafeInfo, it ignores the Safe scope. */
const useSpendingLimits = (): UseSpendingLimitsResult => {
  const safe = useAppSelector(selectSafeInfo).data
  const { spendingLimits, loading } = useSafeSpendingLimits(safe)
  return { spendingLimits: spendingLimits ?? NO_SPENDING_LIMITS, loading }
}

export default useSpendingLimits
