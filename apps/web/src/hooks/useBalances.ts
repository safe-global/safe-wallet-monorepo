import { useMemo } from 'react'
import useLoadBalances, { type PortfolioBalances } from './loadables/useLoadBalances'
import { initialBalancesState } from './loadables/useLoadBalances'

const useBalances = (): {
  balances: PortfolioBalances
  loaded: boolean
  loading: boolean
  error?: string
} => {
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
