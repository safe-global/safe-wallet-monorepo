import { useMemo } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useSafePortfolioSummary } from '@/features/portfolio'

/**
 * The Home total and whether the Safe holds nothing. With PORTFOLIO_SUMMARIES_HOME both come from the
 * CGW summary, which includes DeFi positions; a Safe missing from the summaries keeps the balances.
 */
const useHomeBalance = () => {
  const { balances, loaded: balancesLoaded } = useVisibleBalances()
  const { isEnabled, summary, isLoading } = useSafePortfolioSummary(FEATURES.PORTFOLIO_SUMMARIES_HOME)

  return useMemo(() => {
    if (summary) return { fiatTotal: summary.fiatTotal, noAssets: Number(summary.fiatTotal) === 0 }
    if (isEnabled && isLoading) return { fiatTotal: undefined, noAssets: false }

    const hasAssets = balances.items.some((item) => item.balance !== '0')
    return { fiatTotal: balances.fiatTotal, noAssets: balancesLoaded && !hasAssets }
  }, [summary, isEnabled, isLoading, balances.items, balances.fiatTotal, balancesLoaded])
}

export default useHomeBalance
