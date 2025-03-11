import { useMemo } from 'react'
import isEqual from 'lodash/isEqual'
import { useAppSelector } from '@/store'
import { selectBalances } from '@/store/balancesSlice'
import { type SafeBalanceResponseWithSafenet } from '@/utils/safenet'

const useBalances = (): {
  balances: SafeBalanceResponseWithSafenet
  loading: boolean
  error?: string
} => {
  const state = useAppSelector(selectBalances, isEqual)
  const { data, error, loading } = state

  return useMemo(
    () => ({
      balances: data as SafeBalanceResponseWithSafenet,
      error,
      loading,
    }),
    [data, error, loading],
  )
}

export default useBalances
