import { useMemo } from 'react'
import isEqual from 'lodash/isEqual'
import { useAppSelector } from '@/store'
import { selectBalances } from '@/store/balancesSlice'
import type { PortfolioBalances } from './loadables/useLoadBalances'

const useBalances = (): {
  balances: PortfolioBalances
  loaded: boolean
  loading: boolean
  error?: string
} => {
  const state = useAppSelector(selectBalances, isEqual)
  const { data, error, loaded, loading } = state

  return useMemo(
    () => ({
      balances: data,
      error,
      loaded,
      loading,
    }),
    [data, error, loaded, loading],
  )
}

export default useBalances
