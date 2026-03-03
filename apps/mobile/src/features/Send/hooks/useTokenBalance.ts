import { useMemo } from 'react'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import useMobileTotalBalances from '@/src/hooks/useTotalBalances'
import { isNativeToken } from '../services/tokenTransferParams'

interface UseTokenBalanceArgs {
  tokenAddress: string
}

interface UseTokenBalanceResult {
  token: Balance | undefined
  decimals: number
  maxBalance: string
  hasFiatPrice: boolean
  formattedBalance: string | undefined
}

function findToken(items: Balance[], tokenAddress: string): Balance | undefined {
  return items.find((item) =>
    isNativeToken(tokenAddress) ? item.tokenInfo.type === 'NATIVE_TOKEN' : item.tokenInfo.address === tokenAddress,
  )
}

function getDecimals(token: Balance | undefined): number {
  const raw = token?.tokenInfo.decimals
  return raw != null ? Number(raw) : 18
}

function hasFiatConversion(token: Balance | undefined): boolean {
  return !!token?.fiatConversion && parseFloat(token.fiatConversion) > 0
}

export function useTokenBalance({ tokenAddress }: UseTokenBalanceArgs): UseTokenBalanceResult {
  const { data } = useMobileTotalBalances()

  const token = findToken(data?.items ?? [], tokenAddress)
  const decimals = getDecimals(token)
  const maxBalance = token?.balance ?? '0'
  const hasFiatPrice = hasFiatConversion(token)

  const formattedBalance = useMemo(() => {
    return token ? formatVisualAmount(maxBalance, decimals) : undefined
  }, [token, maxBalance, decimals])

  return { token, decimals, maxBalance, hasFiatPrice, formattedBalance }
}
