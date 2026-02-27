import { type ReactElement, useMemo } from 'react'
import { useRouter } from 'next/router'
import { ChevronRight } from 'lucide-react'
import useBalances from '@/hooks/useBalances'
import { useVisibleAssets } from '@/components/balances/AssetsTable/useHideAssets'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { AppRoutes } from '@/config/routes'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { Button } from '@/components/ui/button'
import TokenIcon from '@/components/common/TokenIcon'

const MAX_ASSETS = 3

const AssetsList = (): ReactElement => {
  const router = useRouter()
  const { loading, balances } = useBalances()
  const visibleAssets = useVisibleAssets()
  const currency = useAppSelector(selectCurrency)

  const items = useMemo(() => {
    return visibleAssets.filter((item) => item.balance !== '0').slice(0, MAX_ASSETS)
  }, [visibleAssets])

  const remainingCount = useMemo(() => {
    const total = visibleAssets.filter((item) => item.balance !== '0').length
    return total > MAX_ASSETS ? total - MAX_ASSETS : undefined
  }, [visibleAssets])

  const isLoading = loading || !balances.fiatTotal

  const handleViewAll = () => {
    router.push({ pathname: AppRoutes.balances.index, query: { safe: router.query.safe } })
  }

  const handleNavigate = () => {
    router.push({ pathname: AppRoutes.balances.index, query: { safe: router.query.safe } })
  }

  return (
    <SafeWidget
      title="Assets"
      data-testid="assets-widget"
      onTitleClick={handleNavigate}
      action={
        <Button variant="ghost" size="icon-sm" onClick={handleNavigate}>
          <ChevronRight className="size-6" />
        </Button>
      }
    >
      {isLoading ? (
        Array.from({ length: MAX_ASSETS }).map((_, i) => <SafeWidget.ItemSkeleton key={i} />)
      ) : items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground" data-testid="no-assets">
          No assets
        </p>
      ) : (
        items.map((item) => (
          <SafeWidget.Item
            key={item.tokenInfo.address}
            label={item.tokenInfo.name}
            info={`${formatVisualAmount(item.balance, item.tokenInfo.decimals)} ${item.tokenInfo.symbol}`}
            data-testid="assets-item"
            startNode={
              <div className="flex size-10 shrink-0 items-center justify-center">
                <TokenIcon
                  logoUri={item.tokenInfo.logoUri || undefined}
                  tokenSymbol={item.tokenInfo.symbol}
                  size={32}
                />
              </div>
            }
            actionNode={
              <span className="text-sm font-medium text-muted-foreground">
                {formatCurrency(item.fiatBalance, currency)}
              </span>
            }
          />
        ))
      )}
      {!isLoading && items.length > 0 && (
        <SafeWidget.Footer count={remainingCount} text="View all assets" onClick={handleViewAll} />
      )}
    </SafeWidget>
  )
}

export default AssetsList
