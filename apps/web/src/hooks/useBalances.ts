import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useRtkBalances } from './loadables/useLoadBalances'

const useBalances = (): {
  balances: Balances
  loading: boolean
  error?: string
} => {
  const { balances, error, loading } = useRtkBalances()
  return { balances, error: error?.message, loading }
}

export default useBalances
