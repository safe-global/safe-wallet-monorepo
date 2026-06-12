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
      {!portfolio.$isDisabled && (
        <div className="-mb-6 flex justify-end">
          <portfolio.PortfolioRefreshHint entryPoint="Dashboard" />
        </div>
      )}
      <div>
        <div className="flex flex-col items-start justify-between md:flex-row md:items-end">
          <TotalAssetValue fiatTotal={balances.fiatTotal} size="lg" title="Total balance" />

          {safe.deployed && <ActionsTray noAssets={noAssets} />}
        </div>
      </div>
    </section>
  )
}

export default Overview
