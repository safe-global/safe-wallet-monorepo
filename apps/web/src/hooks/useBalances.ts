import { useMemo } from 'react'
import useLoadBalances, { type PortfolioBalances, initialBalancesState } from './loadables/useLoadBalances'

export type UseBalancesResult = {
  balances: PortfolioBalances
  loaded: boolean
  loading: boolean
  error?: string
}

const useBalances = (): UseBalancesResult => {
  const [data, error, loading] = useLoadBalances()

  return useMemo(
    () => ({
      balances: data ?? initialBalancesState,
      error: error?.message,
      loaded: !!data,
      loading,
    }),
    [data, error, loading],
  )
}

export default useBalances
