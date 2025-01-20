import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { type SafeBalanceResponse } from '@safe-global/safe-gateway-typescript-sdk'

export const useTokenAmount = (selectedToken: SafeBalanceResponse['items'][0] | undefined) => {
  const totalFiatAmount =
    BigInt(selectedToken?.fiatBalance || 0) * 10n ** BigInt(selectedToken?.tokenInfo.decimals || 1)
  const maxFiatAllowed = 100_000n

  // TODO: Fix maxFiatAllowed below to take fiatConversion into account.
  const maxAmountAllowed = maxFiatAllowed * 10n ** BigInt(selectedToken?.tokenInfo.decimals || 1)

  const maxAmount = totalFiatAmount >= maxAmountAllowed ? maxAmountAllowed : totalFiatAmount

  return { maxAmount }
}

// TODO: Check visible tokens vs Safenet tokens
export const useVisibleTokens = () => {
  const { balances } = useVisibleBalances()
  return balances.items
}
