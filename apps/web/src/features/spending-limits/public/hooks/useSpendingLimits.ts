import { skipToken } from '@reduxjs/toolkit/query'
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

export type UseSpendingLimitsResult = {
  spendingLimits: SpendingLimitState[]
  loading: boolean
}

/** The spending limits of the Safe in the URL, also inside a Space flow: unlike useSafeInfo, it ignores the Safe scope. */
const useSpendingLimits = (): UseSpendingLimitsResult => {
  const isEnabled = useHasFeature(FEATURES.SPENDING_LIMIT) === true
  const safe = useAppSelector(selectSafeInfo).data
  const customRpcs = useAppSelector(selectRpc)
  const args = isEnabled && safe ? toSpendingLimitsArgs(safe, customRpcs) : skipToken
  const { isError } = spendingLimitsApi.endpoints.getSpendingLimits.useQueryState(args)
  const { currentData, isFetching } = useGetSpendingLimitsQuery(args, {
    pollingInterval: isError ? SPENDING_LIMITS_RETRY_MS : 0,
  })

  return {
    spendingLimits: currentData ?? NO_SPENDING_LIMITS,
    loading: !currentData && isFetching,
  }
}

export default useSpendingLimits
