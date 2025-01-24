import { type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { useRtkBalances } from './loadables/useLoadBalances'

const useBalances = (): {
  balances: SafeBalanceResponse
  loading: boolean
  error?: string
} => {
  const { balances, error, loading } = useRtkBalances()
  return { balances, error: error?.message, loading }
}

export default useBalances
