import useAsync from '@/hooks/useAsync'
import { getPolicyGuardContract } from '../utils/contracts'

export type TransactionParameters = {
  safe: string
  to: string
  value: bigint
  data: string
  operation: number
  context?: string
}

export const useCheckTransaction = ({ safe, to, value, data, operation, context }: TransactionParameters) => {
  context = context ?? '0x'
  return useAsync(async () => {
    const policyGuard = getPolicyGuardContract()
    try {
      await policyGuard.checkTransaction.staticCall(safe, to, value, data, operation, context)
      return true
    } catch (err) {
      console.warn(err)
      return false
    }
  }, [safe, to, value, data, operation, context])
}
