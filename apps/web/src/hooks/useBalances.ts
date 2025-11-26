import { useRef } from 'react'
import isEqual from 'lodash/isEqual'
import useLoadBalances, { type PortfolioBalances, initialBalancesState } from './loadables/useLoadBalances'

export type UseBalancesResult = {
  balances: PortfolioBalances
  loaded: boolean
  loading: boolean
  error?: string
}

const useBalances = (): UseBalancesResult => {
  const [data, error, loading] = useLoadBalances()
  const resultRef = useRef<UseBalancesResult>({
    balances: initialBalancesState,
    loaded: false,
    loading: false,
    error: undefined,
  })

  const newResult: UseBalancesResult = {
    balances: data ?? initialBalancesState,
    error: error?.message,
    loaded: !!data,
    loading,
  }

  if (!isEqual(resultRef.current, newResult)) {
    resultRef.current = newResult
  }

  return resultRef.current
}

export default useBalances
