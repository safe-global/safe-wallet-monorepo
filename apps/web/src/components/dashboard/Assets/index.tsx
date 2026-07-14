import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import useBalances from '@/hooks/useBalances'
import TokenAmount from '@/components/common/TokenAmount'
import { SwapFeature, useIsSwapFeatureEnabled } from '@/features/swap'
import { useLoadFeature } from '@/features/__core__'
import { AppRoutes } from '@/config/routes'
import { WidgetCard } from '../styled'
import css from './styles.module.css'
import { useRouter } from 'next/router'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { useVisibleAssets } from '@/components/balances/AssetsTable/useHideAssets'
import SendButton from '@/components/balances/AssetsTable/SendButton'
import { FiatBalance } from '@/components/balances/AssetsTable/FiatBalance'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import { isEligibleEarnToken, useIsEarnPromoEnabled, EarnButton } from '@/features/earn'
import { EARN_LABELS } from '@/services/analytics/events/earn'
import { useIsStakingBannerEnabled as useIsStakingPromoEnabled } from '@/features/stake'
import useChainId from '@/hooks/useChainId'
import TokenIcon from '@/components/common/TokenIcon'
import { TokenType } from '@safe-global/store/gateway/types'
import { StakeFeature } from '@/features/stake'
import { STAKE_LABELS } from '@/services/analytics/events/stake'
import NoAssetsIcon from '@/public/images/common/no-assets.svg'

const MAX_ASSETS = 4

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

const ASSET_BUTTON_SIZE = 28
const ASSET_BUTTON_GAP = 8
const VALUE_CONTAINER_GAP = 16

const getAssetButtonsWidth = (buttonCount: number) =>
  buttonCount * ASSET_BUTTON_SIZE + (buttonCount - 1) * ASSET_BUTTON_GAP

const AssetRow = ({
  item,
  chainId,
  showSwap,
  showEarn,
  showStake,
}: {
  item: Balances['items'][number]
  chainId: string
  showSwap?: boolean
  showEarn?: boolean
  showStake?: boolean
}) => {
  const stake = useLoadFeature(StakeFeature)
  const { SwapButton } = useLoadFeature(SwapFeature)

  const assetButtonCount =
    1 + // SendButton always
    (showSwap ? 1 : 0) +
    (showEarn && isEligibleEarnToken(chainId, item.tokenInfo.address) ? 1 : 0) +
    (showStake && item.tokenInfo.type === TokenType.NATIVE_TOKEN ? 1 : 0)
  const assetButtonsOffset = VALUE_CONTAINER_GAP + getAssetButtonsWidth(assetButtonCount)

  return (
    <div className={css.container} key={item.tokenInfo.address}>
      <div className="flex flex-row items-center gap-3">
        <TokenIcon tokenSymbol={item.tokenInfo.symbol} logoUri={item.tokenInfo.logoUri || undefined} size={32} />
        <div>
          <Typography variant="paragraph-bold">{item.tokenInfo.name}</Typography>
          <Typography variant="paragraph-small" className={css.tokenAmount}>
            <TokenAmount value={item.balance} decimals={item.tokenInfo.decimals} tokenSymbol={item.tokenInfo.symbol} />
          </Typography>
        </div>
      </div>

      <div className={css.valueContainer} style={{ ['--asset-buttons-offset' as string]: `${assetButtonsOffset}px` }}>
        <div className={css.valueContent}>
          <FiatBalance balanceItem={item} />
          <FiatChange balanceItem={item} inline />
        </div>

        <div className={css.assetButtons}>
          <SendButton tokenInfo={item.tokenInfo} onlyIcon />

          {showSwap && (
            <SwapButton tokenInfo={item.tokenInfo} amount="0" trackingLabel={SWAP_LABELS.dashboard_assets} onlyIcon />
          )}

          {showEarn && isEligibleEarnToken(chainId, item.tokenInfo.address) && (
            <EarnButton tokenInfo={item.tokenInfo} trackingLabel={EARN_LABELS.dashboard_asset} onlyIcon />
          )}

          {showStake && item.tokenInfo.type === TokenType.NATIVE_TOKEN && (
            <stake.StakeButton tokenInfo={item.tokenInfo} trackingLabel={STAKE_LABELS.asset} onlyIcon />
          )}
        </div>
      </div>
    </div>
  )
}

const AssetList = ({ items }: { items: Balances['items'] }) => {
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isEarnPromoEnabled = useIsEarnPromoEnabled()
  const isStakingPromoEnabled = useIsStakingPromoEnabled()
  const chainId = useChainId()

  return (
    <div className="flex flex-col">
      {items.map((item, index) => (
        <div key={item.tokenInfo.address}>
          {index > 0 && <Separator className="ml-14 opacity-50" />}
          <AssetRow
            item={item}
            chainId={chainId}
            showSwap={isSwapFeatureEnabled}
            showEarn={isEarnPromoEnabled}
            showStake={isStakingPromoEnabled}
          />
        </div>
      ))}
    </div>
  )
}

export const isNonZeroBalance = (item: Balances['items'][number]) => item.balance !== '0'

const AssetsWidget = () => {
  const router = useRouter()
  const { safe } = router.query
  const { loading, balances } = useBalances()
  const visibleAssets = useVisibleAssets()

  const items = useMemo(() => {
    return visibleAssets.filter(isNonZeroBalance).slice(0, MAX_ASSETS)
  }, [visibleAssets])

  const viewAllUrl = useMemo(
    () => ({
      pathname: AppRoutes.balances.index,
      query: { safe },
    }),
    [safe],
  )

  const isLoading = loading || !balances.fiatTotal

  if (isLoading) return <AssetsSkeleton />

  return (
    <WidgetCard title="Top assets" viewAllUrl={items.length > 0 ? viewAllUrl : undefined} testId="assets-widget">
      <div>{items.length > 0 ? <AssetList items={items} /> : <NoAssets />}</div>
    </WidgetCard>
  )
}

export default AssetsWidget
