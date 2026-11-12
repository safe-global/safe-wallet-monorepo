import { useMemo } from 'react'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useSafePortfolioSummary } from '@/features/portfolio'

/**
 * The current Safe's total on Home and Assets. With PORTFOLIO_SUMMARIES it is the CGW summary (positions included,
 * hidden tokens not subtracted), or the balances when the Safe is missing from the summaries.
 */
const useSafeTotalBalance = () => {
  const { balances, loaded: balancesLoaded } = useVisibleBalances()
  const { isEnabled, summary, isLoading } = useSafePortfolioSummary()

  return useMemo(() => {
    if (summary) {
      return { fiatTotal: summary.fiatTotal, noAssets: Number(summary.fiatTotal) === 0, isSummaryEnabled: isEnabled }
    }
    if (isEnabled && isLoading) return { fiatTotal: undefined, noAssets: false, isSummaryEnabled: isEnabled }

    const hasAssets = balances.items.some((item) => item.balance !== '0')
    return { fiatTotal: balances.fiatTotal, noAssets: balancesLoaded && !hasAssets, isSummaryEnabled: isEnabled }
  }, [summary, isEnabled, isLoading, balances.items, balances.fiatTotal, balancesLoaded])
}

export default useSafeTotalBalance
