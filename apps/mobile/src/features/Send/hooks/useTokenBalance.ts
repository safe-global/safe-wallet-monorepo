import { useMemo } from 'react'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { isNativeToken } from '../services/tokenTransferParams'

interface UseTokenBalanceArgs {
  chainId: string
  safeAddress: string
  tokenAddress: string
  currency: string
}

interface UseTokenBalanceResult {
  token: Balance | undefined
  decimals: number
  maxBalance: string
  hasFiatPrice: boolean
  formattedBalance: string | undefined
}

export function useTokenBalance({
  chainId,
  safeAddress,
  tokenAddress,
  currency,
}: UseTokenBalanceArgs): UseTokenBalanceResult {
  const { data: balancesData } = useBalancesGetBalancesV1Query({
    chainId,
    safeAddress,
    fiatCode: currency,
  })

  const token = balancesData?.items.find((item) => {
    if (isNativeToken(tokenAddress)) {
      return item.tokenInfo.type === 'NATIVE_TOKEN'
    }
    return item.tokenInfo.address === tokenAddress
  })

  const raw = token?.tokenInfo.decimals
  const decimals = raw != null ? Number(raw) : 18
  const maxBalance = token?.balance ?? '0'
  const hasFiatPrice = !!token?.fiatConversion && parseFloat(token.fiatConversion) > 0

  const formattedBalance = useMemo(() => {
    return token ? formatVisualAmount(maxBalance, decimals) : undefined
  }, [token, maxBalance, decimals])

  return { token, decimals, maxBalance, hasFiatPrice, formattedBalance }
}
