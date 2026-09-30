import { type ReactElement, useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import OverviewSkeleton from './OverviewSkeleton'
import { PortfolioFeature } from '@/features/portfolio'
import { ActionsTrayFeature } from '@/features/actions-tray'
import { useLoadFeature } from '@/features/__core__'

const Overview = (): ReactElement => {
  const { safe, safeLoading, safeLoaded } = useSafeInfo()
  const { balances, loaded: balancesLoaded, loading: balancesLoading } = useVisibleBalances()
  const portfolio = useLoadFeature(PortfolioFeature)
  const { ActionsTray } = useLoadFeature(ActionsTrayFeature)

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = safeLoading || balancesLoading || isInitialState

  const items = useMemo(() => {
    return balances.items.filter((item) => item.balance !== '0')
  }, [balances.items])

  const noAssets = balancesLoaded && items.length === 0

  if (isLoading) return <OverviewSkeleton />

  return (
    <section className="overflow-hidden rounded-3xl bg-[var(--color-background-paper)] px-6 pb-3 pt-5">
      {/* Refresh hint pinned to the top, actions to the bottom so they line up with the balance,
          which keeps the hint from overlapping them when they wrap onto a second row. */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-stretch">
        <div className="flex items-end">
          <TotalAssetValue fiatTotal={balances.fiatTotal} size="lg" title="Total balance" />
        </div>

        <div className="flex flex-col items-start gap-4 md:items-end">
          {!portfolio.$isDisabled && <portfolio.PortfolioRefreshHint entryPoint="Dashboard" />}

          {/* `mt-auto` rather than a `justify-between` on the column: that only reaches the bottom
              while the hint above is also rendered, and the hint is conditional — with the actions
              alone in the column they sat at the top, level with the balance's label instead of its
              figure. */}
          {safe.deployed && (
            <div className="md:mt-auto">
              <ActionsTray noAssets={noAssets} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Overview
