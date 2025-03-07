import { useAppSelector } from '@/store'
import { selectBalances } from '@/store/balancesSlice'
import { type BalancesSafenet } from '@/utils/safenet'
import isEqual from 'lodash/isEqual'
import { useMemo } from 'react'

const useBalances = (): {
  balances: BalancesSafenet
  loading: boolean
  error?: string
} => {
  const state = useAppSelector(selectBalances, isEqual)
  const { data, error, loading } = state

  return useMemo(
    () => ({
      balances: data as BalancesSafenet,
      error,
      loading,
    }),
    [data, error, loading],
  )
}

export default useBalances
