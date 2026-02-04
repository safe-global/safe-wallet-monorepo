import useGasLimit from '@/hooks/useGasLimit'
import { MAX_GAS_LIMIT_NO_FEE_CAMPAIGN } from '../constants'
import type { SafeTransaction } from '@safe-global/types-kit'

export function useGasTooHigh(safeTx?: SafeTransaction): boolean | undefined {
  const { gasLimit } = useGasLimit(safeTx)

  // Check if gas limit exceeds maximum allowed for No Fee November
  if (gasLimit && BigInt(gasLimit) > MAX_GAS_LIMIT_NO_FEE_CAMPAIGN) {
    return true
  }

  return false
}
