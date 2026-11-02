import { useMemo } from 'react'
import useLoadBalances from './loadables/useLoadBalances'
import { type PortfolioBalances, initialBalancesState } from '@safe-global/utils/hooks/portfolioBalances'

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
