import { type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'

// TODO: Calculate Safenet available amount
export const useTokenAmount = (selectedToken: SafeBalanceResponse['items'][0] | undefined) => {
  const maxAmount = BigInt(selectedToken?.balance || 0)
  return { maxAmount }
}
