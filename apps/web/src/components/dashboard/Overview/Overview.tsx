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
      {/* Refresh hint pinned to the top, actions to the bottom (aligned with the balance) via a
          stretched `justify-between` column — keeps the original look while making it impossible for
          the hint to overlap the actions when they wrap onto a second row on narrow widths. */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-stretch">
        <div className="flex items-end">
          <TotalAssetValue fiatTotal={balances.fiatTotal} size="lg" title="Total balance" />
        </div>

        <div className="flex flex-col items-start gap-4 md:items-end md:justify-between">
          {!portfolio.$isDisabled && <portfolio.PortfolioRefreshHint entryPoint="Dashboard" />}

          {safe.deployed && <ActionsTray noAssets={noAssets} />}
        </div>
      </div>
    </section>
  )
}

export default Overview
