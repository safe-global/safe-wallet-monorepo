import type { ReactElement } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { SafeWidgetRoot } from '@views/features/spaces/components/SafeWidget/SafeWidgetRoot'
import { WidgetFooter } from '@views/features/spaces/components/SafeWidget/WidgetFooter'
import { WidgetItemSkeleton } from '@views/features/spaces/components/SafeWidget/WidgetItemSkeleton'
import { WidgetItem } from '@/features/spaces/components/SafeWidget/WidgetItem'
import { Button } from '@/components/ui/button'
import TokenIcon from '@/components/common/TokenIcon'

export type AssetsListViewProps = {
  isLoading: boolean
  items: Balance[]
  remainingCount?: number
  currency: string
  skeletonCount: number
  onViewAll: () => void
}

export const AssetsListView = ({
  isLoading,
  items,
  remainingCount,
  currency,
  skeletonCount,
  onViewAll,
}: AssetsListViewProps): ReactElement => {
  return (
    <SafeWidgetRoot
      title="Assets"
      action={
        <Button variant="ghost" size="icon-sm" onClick={onViewAll}>
          <ChevronRight className="size-6" />
        </Button>
      }
    >
      {isLoading ? (
        Array.from({ length: skeletonCount }).map((_, i) => <WidgetItemSkeleton key={i} />)
      ) : items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">No assets</p>
      ) : (
        items.map((item) => (
          <WidgetItem
            key={item.tokenInfo.address}
            label={item.tokenInfo.name}
            info={`${formatVisualAmount(item.balance, item.tokenInfo.decimals)} ${item.tokenInfo.symbol}`}
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
        <WidgetFooter count={remainingCount} text="View all assets" onClick={onViewAll} />
      )}
    </SafeWidgetRoot>
  )
}
