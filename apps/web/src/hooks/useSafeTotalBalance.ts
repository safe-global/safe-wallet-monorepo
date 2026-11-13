import { useMemo } from 'react'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { useSafePortfolioSummary } from '@/features/portfolio'

/** The current Safe's total on Home and Assets: its CGW summary with PORTFOLIO_SUMMARIES, otherwise its balances. */
const useSafeTotalBalance = () => {
  const { balances, loaded: balancesLoaded } = useVisibleBalances()
  const { isEnabled, summary, isLoading } = useSafePortfolioSummary()

  return useMemo(() => {
    const hasNoTokens = balancesLoaded && !balances.items.some((item) => item.balance !== '0')

    if (summary) {
      // A zero summary alone isn't empty: tokens without a price, below dust or untrusted still count as assets
      const noAssets = Number(summary.fiatTotal) === 0 && hasNoTokens
      return { fiatTotal: summary.fiatTotal, noAssets, isSummaryEnabled: isEnabled }
    }
    if (isEnabled && isLoading) return { fiatTotal: undefined, noAssets: false, isSummaryEnabled: isEnabled }
    // Without a summary the balances are the fallback; until they load their total is '', which would show as $0
    if (isEnabled && !balancesLoaded) return { fiatTotal: undefined, noAssets: false, isSummaryEnabled: isEnabled }

    return { fiatTotal: balances.fiatTotal, noAssets: hasNoTokens, isSummaryEnabled: isEnabled }
  }, [summary, isEnabled, isLoading, balances.items, balances.fiatTotal, balancesLoaded])
}

export default useSafeTotalBalance
