import { useMemo } from 'react'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import useLoadBalances from './loadables/useLoadBalances'

const initialBalancesState: Balances = {
  items: [],
  fiatTotal: '',
}

const useBalances = (): {
  balances: Balances
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
