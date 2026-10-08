import { CounterfactualFeature } from '@/features/counterfactual'
import { useLoadFeature } from '@/features/__core__'
import type { ReactElement } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import TokenMenu from '@/components/balances/TokenMenu'
import useBalances from '@/hooks/useBalances'
import { useHideAssets, useVisibleAssets } from './useHideAssets'
import AddFundsCTA from '@/components/common/AddFunds'
import { useIsSwapFeatureEnabled } from '@/features/swap'
import { useIsEarnPromoEnabled } from '@/features/earn'
import { useSafeTokenEnabled } from '@/hooks/useSafeTokenEnabled'
import useChainId from '@/hooks/useChainId'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { AssetRowContent } from './AssetRowContent'
import { ActionButtons } from './ActionButtons'
import { HiddenTokensInfo } from './HiddenTokensInfo'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { AssetsTableView } from '@views/components/balances/AssetsTable/AssetsTableView'

/**
 * Wrapper component for counterfactual CheckBalance.
 * Extracted to reduce cyclomatic complexity in AssetsTable.
 */
function CounterfactualCheckBalance(): ReactElement | null {
  const { CheckBalance } = useLoadFeature(CounterfactualFeature)
  return CheckBalance ? <CheckBalance /> : null
}

const AssetsTable = ({
  showHiddenAssets,
  setShowHiddenAssets,
  onOpenManageTokens,
}: {
  showHiddenAssets: boolean
  setShowHiddenAssets: (hidden: boolean) => void
  onOpenManageTokens?: () => void
}): ReactElement => {
  const { balances, loading } = useBalances()
  const { balances: visibleBalances } = useVisibleBalances()

  const chainId = useChainId()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isSafenetStakingEnabled = useSafeTokenEnabled()
  const isEarnPromoEnabled = useIsEarnPromoEnabled()

  const { isAssetSelected, toggleAsset, cancel, deselectAll, saveChanges } = useHideAssets(() =>
    setShowHiddenAssets(false),
  )

  const visible = useVisibleAssets()
  const visibleAssets = showHiddenAssets ? balances.items : visible
  const hasNoAssets =
    !loading && (balances.items.length === 0 || (balances.items.length === 1 && balances.items[0].balance === '0'))
  const selectedAssetCount = visibleAssets?.filter((item) => isAssetSelected(item.tokenInfo.address)).length || 0

  const tokensFiatTotal = visibleBalances.tokensFiatTotal ? Number(visibleBalances.tokensFiatTotal) : undefined

  const items = (visibleAssets || []).map((item) => ({
    item,
    isSelected: isAssetSelected(item.tokenInfo.address),
    shareOfFiatTotal: tokensFiatTotal ? Number(item.fiatBalance) / tokensFiatTotal : null,
  }))

  const isMobile = useIsMobile()

  const renderAssetRow = (item: Balance) => (
    <AssetRowContent
      item={item}
      chainId={chainId}
      isSafenetStakingEnabled={isSafenetStakingEnabled}
      isEarnPromoEnabled={isEarnPromoEnabled ?? false}
      showMobileValue
      showMobileBalance
    />
  )

  const renderMobileActions = (item: Balance) => (
    <ActionButtons tokenInfo={item.tokenInfo} isSwapFeatureEnabled={isSwapFeatureEnabled ?? false} mobile />
  )

  const renderActions = (item: Balance, isSelected: boolean) => (
    <ActionButtons
      tokenInfo={item.tokenInfo}
      isSwapFeatureEnabled={isSwapFeatureEnabled ?? false}
      onlyIcon
      showHiddenAssets={showHiddenAssets}
      isSelected={isSelected}
      onToggleAsset={() => toggleAsset(item.tokenInfo.address)}
    />
  )

  return (
    <>
      <TokenMenu
        saveChanges={saveChanges}
        cancel={cancel}
        deselectAll={deselectAll}
        selectedAssetCount={selectedAssetCount}
        showHiddenAssets={showHiddenAssets}
      />

      {hasNoAssets ? (
        <AddFundsCTA />
      ) : (
        <AssetsTableView
          items={items}
          loading={loading}
          isMobile={isMobile}
          showHiddenAssets={showHiddenAssets}
          hiddenTokensInfo={<HiddenTokensInfo onOpenManageTokens={onOpenManageTokens} />}
          renderAssetRow={renderAssetRow}
          renderMobileActions={renderMobileActions}
          renderActions={renderActions}
        />
      )}

      <CounterfactualCheckBalance />
    </>
  )
}

export default AssetsTable
