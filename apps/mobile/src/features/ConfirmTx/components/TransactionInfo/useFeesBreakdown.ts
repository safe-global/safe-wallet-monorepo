import { useMemo } from 'react'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChainCurrency } from '@/src/store/chains'
import { buildFeesBreakdown, type FeeLine, type FeesBreakdownData } from './feeRows'

interface UseFeesBreakdownArgs {
  detailedExecutionInfo?: MultisigExecutionDetails
  outgoing?: FeeLine
  balances?: Balances
}

/**
 * Wraps {@link buildFeesBreakdown} with the store read and native-currency mapping shared by every
 * fee surface (breakdown, execute footer, token-transfer header). Returns `undefined` until both
 * the execution details and the active chain's native currency are known, so callers don't repeat
 * those guards.
 */
export const useFeesBreakdown = ({
  detailedExecutionInfo,
  outgoing,
  balances,
}: UseFeesBreakdownArgs): FeesBreakdownData | undefined => {
  const nativeCurrency = useAppSelector(selectActiveChainCurrency)

  return useMemo(() => {
    if (!detailedExecutionInfo || !nativeCurrency) {
      return undefined
    }
    return buildFeesBreakdown({
      detailedExecutionInfo,
      nativeCurrency: { address: ZERO_ADDRESS, symbol: nativeCurrency.symbol, decimals: nativeCurrency.decimals },
      outgoing,
      balances,
    })
  }, [detailedExecutionInfo, nativeCurrency, outgoing, balances])
}
