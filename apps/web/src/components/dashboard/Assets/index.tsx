import { useMemo } from 'react'
import useBalances from '@/hooks/useBalances'
import { SwapFeature, useIsSwapFeatureEnabled } from '@/features/swap'
import { useLoadFeature } from '@/features/__core__'
import { AppRoutes } from '@/config/routes'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { useVisibleAssets } from '@/components/balances/AssetsTable/useHideAssets'
import SendButton from '@/components/balances/AssetsTable/SendButton'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { isEligibleEarnToken, useIsEarnPromoEnabled, EarnButton } from '@/features/earn'
import { EARN_LABELS } from '@/services/analytics/events/earn'
import { useIsStakingBannerEnabled as useIsStakingPromoEnabled } from '@/features/stake'
import useChainId from '@/hooks/useChainId'
import TokenIcon from '@/components/common/TokenIcon'
import TokenAmount from '@/components/common/TokenAmount'
import { TokenType } from '@safe-global/store/gateway/types'
import { StakeFeature } from '@/features/stake'
import { STAKE_LABELS } from '@/services/analytics/events/stake'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { AssetListView, AssetRowView, AssetsView } from '@views/components/dashboard/Assets/AssetsView'

const MAX_ASSETS = 4

const ASSET_BUTTON_SIZE = 28
const ASSET_BUTTON_GAP = 8
const VALUE_CONTAINER_GAP = 16
const ZERO_AMOUNT = '0'

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
  const { StakeButton } = useLoadFeature(StakeFeature)
  const { SwapButton } = useLoadFeature(SwapFeature)

  const isEarnVisible = !!showEarn && isEligibleEarnToken(chainId, item.tokenInfo.address)
  const isStakeVisible = !!showStake && item.tokenInfo.type === TokenType.NATIVE_TOKEN

  const assetButtonCount =
    1 + // SendButton always
    (showSwap ? 1 : 0) +
    (isEarnVisible ? 1 : 0) +
    (isStakeVisible ? 1 : 0)
  const assetButtonsOffset = VALUE_CONTAINER_GAP + getAssetButtonsWidth(assetButtonCount)

  return (
    <AssetRowView
      item={item}
      assetButtonsOffset={assetButtonsOffset}
      tokenIcon={
        <TokenIcon tokenSymbol={item.tokenInfo.symbol} logoUri={item.tokenInfo.logoUri || undefined} size={32} />
      }
      tokenAmount={
        <TokenAmount value={item.balance} decimals={item.tokenInfo.decimals} tokenSymbol={item.tokenInfo.symbol} />
      }
      sendButton={<SendButton tokenInfo={item.tokenInfo} onlyIcon />}
      showSwap={showSwap}
      swapButton={
        <SwapButton
          tokenInfo={item.tokenInfo}
          amount={ZERO_AMOUNT}
          trackingLabel={SWAP_LABELS.dashboard_assets}
          onlyIcon
        />
      }
      showEarn={isEarnVisible}
      earnButton={<EarnButton tokenInfo={item.tokenInfo} trackingLabel={EARN_LABELS.dashboard_asset} onlyIcon />}
      showStake={isStakeVisible}
      stakeButton={<StakeButton tokenInfo={item.tokenInfo} trackingLabel={STAKE_LABELS.asset} onlyIcon />}
    />
  )
}

const AssetList = ({ items }: { items: Balances['items'] }) => {
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isEarnPromoEnabled = useIsEarnPromoEnabled()
  const isStakingPromoEnabled = useIsStakingPromoEnabled()
  const chainId = useChainId()

  return (
    <AssetListView
      items={items}
      renderRow={(item) => (
        <AssetRow
          item={item}
          chainId={chainId}
          showSwap={isSwapFeatureEnabled}
          showEarn={isEarnPromoEnabled}
          showStake={isStakingPromoEnabled}
        />
      )}
    />
  )
}

export const isNonZeroBalance = (item: Balances['items'][number]) => item.balance !== '0'

const AssetsWidget = () => {
  const safeLinkQuery = useSafeLinkQuery()
  const { loading, balances } = useBalances()
  const visibleAssets = useVisibleAssets()

  const items = useMemo(() => {
    return visibleAssets.filter(isNonZeroBalance).slice(0, MAX_ASSETS)
  }, [visibleAssets])

  const viewAllUrl = useMemo(
    () => ({
      pathname: AppRoutes.balances.index,
      query: safeLinkQuery,
    }),
    [safeLinkQuery],
  )

  const isLoading = loading || !balances.fiatTotal

  if (isLoading) return <AssetsView isLoading />

  return (
    <AssetsView
      isLoading={false}
      hasItems={items.length > 0}
      viewAllUrl={viewAllUrl}
      assetList={<AssetList items={items} />}
    />
  )
}

export default AssetsWidget
