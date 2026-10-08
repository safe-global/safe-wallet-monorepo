import type { ReactElement, ReactNode } from 'react'
import type { LinkProps } from 'next/link'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { WidgetCard } from '@views/components/dashboard/styled'
import { FiatBalance } from '@/components/balances/AssetsTable/FiatBalance'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import NoAssetsIcon from '@/public/images/common/no-assets.svg'
import css from './styles.module.css'

type AssetItem = Balances['items'][number]

const NoAssets = () => (
  <div className="rounded-xl bg-[var(--color-background-paper)] p-10 text-center">
    <div className="flex justify-center">
      <NoAssetsIcon />
    </div>

    <Typography className="mb-1 mt-6">No assets yet</Typography>

    <Typography className="text-[var(--color-primary-light)]">Deposit from another wallet to get started.</Typography>
  </div>
)

const AssetsSkeleton = () => (
  <WidgetCard title="Top assets" testId="assets-widget">
    <Skeleton className="h-[66px] w-full rounded-lg" />
  </WidgetCard>
)

export type AssetRowViewProps = {
  item: AssetItem
  assetButtonsOffset: number
  tokenIcon: ReactNode
  tokenAmount: ReactNode
  sendButton: ReactNode
  showSwap?: boolean
  swapButton?: ReactNode
  showEarn: boolean
  earnButton?: ReactNode
  showStake: boolean
  stakeButton?: ReactNode
}

export function AssetRowView({
  item,
  assetButtonsOffset,
  tokenIcon,
  tokenAmount,
  sendButton,
  showSwap,
  swapButton,
  showEarn,
  earnButton,
  showStake,
  stakeButton,
}: AssetRowViewProps): ReactElement {
  return (
    <div className={css.container} key={item.tokenInfo.address}>
      <div className="flex flex-row items-center gap-3">
        {tokenIcon}
        <div>
          <Typography variant="paragraph-bold">{item.tokenInfo.name}</Typography>
          <Typography variant="paragraph-small" className={css.tokenAmount}>
            {tokenAmount}
          </Typography>
        </div>
      </div>

      <div className={css.valueContainer} style={{ ['--asset-buttons-offset' as string]: `${assetButtonsOffset}px` }}>
        <div className={css.valueContent}>
          <FiatBalance balanceItem={item} />
          <FiatChange balanceItem={item} inline />
        </div>

        <div className={css.assetButtons}>
          {sendButton}

          {showSwap && swapButton}

          {showEarn && earnButton}

          {showStake && stakeButton}
        </div>
      </div>
    </div>
  )
}

export type AssetListViewProps = {
  items: Balances['items']
  renderRow: (item: AssetItem) => ReactNode
}

export function AssetListView({ items, renderRow }: AssetListViewProps): ReactElement {
  return (
    <div className="flex flex-col">
      {items.map((item, index) => (
        <div key={item.tokenInfo.address}>
          {index > 0 && <Separator className="ml-14 opacity-50" />}
          {renderRow(item)}
        </div>
      ))}
    </div>
  )
}

export type AssetsViewProps = {
  isLoading: boolean
  hasItems?: boolean
  viewAllUrl?: LinkProps['href']
  assetList?: ReactNode
}

export function AssetsView({ isLoading, hasItems, viewAllUrl, assetList }: AssetsViewProps): ReactElement {
  if (isLoading) return <AssetsSkeleton />

  return (
    <WidgetCard title="Top assets" viewAllUrl={hasItems ? viewAllUrl : undefined} testId="assets-widget">
      <div>{hasItems ? assetList : <NoAssets />}</div>
    </WidgetCard>
  )
}
