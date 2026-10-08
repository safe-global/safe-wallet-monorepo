import { type ReactElement, useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import OverviewSkeleton from '@views/components/dashboard/Overview/OverviewSkeleton'
import { PortfolioFeature } from '@/features/portfolio'
import { ActionsTrayFeature } from '@/features/actions-tray'
import { useLoadFeature } from '@/features/__core__'
import { OverviewView } from '@views/components/dashboard/Overview/OverviewView'

const REFRESH_HINT_ENTRY_POINT = 'Dashboard'

const Overview = (): ReactElement => {
  const { safe, safeLoading, safeLoaded } = useSafeInfo()
  const { balances, loaded: balancesLoaded, loading: balancesLoading } = useVisibleBalances()
  const portfolio = useLoadFeature(PortfolioFeature)
  const { ActionsTray } = useLoadFeature(ActionsTrayFeature)
  const { PortfolioRefreshHint } = portfolio

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = safeLoading || balancesLoading || isInitialState

  const items = useMemo(() => {
    return balances.items.filter((item) => item.balance !== '0')
  }, [balances.items])

  const noAssets = balancesLoaded && items.length === 0

  if (isLoading) return <OverviewSkeleton />

  return (
    <OverviewView
      renderTotalAssetValue={(props) => <TotalAssetValue fiatTotal={balances.fiatTotal} {...props} />}
      refreshHint={!portfolio.$isDisabled && <PortfolioRefreshHint entryPoint={REFRESH_HINT_ENTRY_POINT} />}
      showActions={safe.deployed}
      actionsTray={<ActionsTray noAssets={noAssets} />}
    />
  )
}

export default Overview
