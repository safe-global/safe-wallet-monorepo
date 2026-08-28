import { CounterfactualFeature } from '@/features/counterfactual'
import { useLoadFeature } from '@/features/__core__'
import React, { type ReactElement } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { useIsMobile } from '@/hooks/use-mobile'
import classNames from 'classnames'
import css from './styles.module.css'
import EnhancedTable, { type EnhancedTableProps } from '@/components/common/EnhancedTable'
import TokenMenu from '../TokenMenu'
import useBalances from '@/hooks/useBalances'
import { useHideAssets, useVisibleAssets } from './useHideAssets'
import AddFundsCTA from '@/components/common/AddFunds'
import { useIsSwapFeatureEnabled } from '@/features/swap'
import { useIsEarnPromoEnabled } from '@/features/earn'
import { useIsStakingBannerEnabled as useIsStakingPromoEnabled } from '@/features/stake'
import { FiatChange } from './FiatChange'
import { FiatBalance } from './FiatBalance'
import useChainId from '@/hooks/useChainId'
import FiatValue from '@/components/common/FiatValue'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { AssetRowContent } from './AssetRowContent'
import { ActionButtons } from './ActionButtons'
import TokenAmount from '@/components/common/TokenAmount'
import { HiddenTokensInfo } from './HiddenTokensInfo'

const skeletonCells: EnhancedTableProps['rows'][0]['cells'] = {
  asset: {
    rawValue: '0x0',
    content: (
      <div className={css.token}>
        <Skeleton className="h-[26px] w-[26px] rounded-md" />
        <Typography as="div">
          <Skeleton className="h-4 w-[80px]" />
        </Typography>
      </div>
    ),
  },
  price: {
    rawValue: '0',
    content: (
      <Typography as="div">
        <Skeleton className="h-4 w-[32px]" />
      </Typography>
    ),
  },
  balance: {
    rawValue: '0',
    content: (
      <Typography as="div">
        <Skeleton className="h-4 w-[32px]" />
      </Typography>
    ),
  },
  weight: {
    rawValue: '0',
    content: (
      <Typography as="div">
        <Skeleton className="h-4 w-[32px]" />
      </Typography>
    ),
  },
  value: {
    rawValue: '0',
    content: (
      <Typography as="div">
        <Skeleton className="h-4 w-[32px]" />
      </Typography>
    ),
  },
  actions: {
    rawValue: '',
    sticky: true,
    content: (
      <div className="flex flex-row justify-end gap-2">
        <Skeleton className="h-[28px] w-[28px] rounded-md" />
        <Skeleton className="h-[28px] w-[28px] rounded-md" />
        <Skeleton className="h-[24px] w-[24px] rounded-md" />
      </div>
    ),
  },
}

const skeletonRows: EnhancedTableProps['rows'] = Array(3).fill({ cells: skeletonCells })

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
  const headCells = [
    { id: 'asset', label: 'Asset', width: '35%' },
    { id: 'price', label: 'Price', width: '16%', align: 'right' },
    { id: 'balance', label: 'Balance', width: '16%', align: 'right' },
    {
      id: 'weight',
      label: (
        <Tooltip>
          <TooltipTrigger render={<span>Weight</span>} />
          <TooltipContent>Based on total portfolio value</TooltipContent>
        </Tooltip>
      ),
      width: '16%',
      align: 'right',
    },
    { id: 'value', label: 'Value', width: '17%', align: 'right' },
    { id: 'actions', label: 'Actions', width: showHiddenAssets ? '130px' : '86px', align: 'right', disableSort: true },
  ]
  const { balances, loading } = useBalances()
  const { balances: visibleBalances } = useVisibleBalances()

  const chainId = useChainId()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isStakingPromoEnabled = useIsStakingPromoEnabled()
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

  const rows = loading
    ? skeletonRows
    : (visibleAssets || []).map((item) => {
        const rawFiatValue = parseFloat(item.fiatBalance)
        const rawPriceValue = parseFloat(item.fiatConversion)
        const isSelected = isAssetSelected(item.tokenInfo.address)
        const itemShareOfFiatTotal = tokensFiatTotal ? Number(item.fiatBalance) / tokensFiatTotal : null

        return {
          key: item.tokenInfo.address,
          selected: isSelected,
          cells: {
            asset: {
              rawValue: item.tokenInfo.name,
              content: (
                <div>
                  <AssetRowContent
                    item={item}
                    chainId={chainId}
                    isStakingPromoEnabled={isStakingPromoEnabled ?? false}
                    isEarnPromoEnabled={isEarnPromoEnabled ?? false}
                    showMobileValue
                    showMobileBalance
                  />
                  <ActionButtons
                    tokenInfo={item.tokenInfo}
                    isSwapFeatureEnabled={isSwapFeatureEnabled ?? false}
                    mobile
                  />
                </div>
              ),
            },
            price: {
              rawValue: rawPriceValue,
              content: (
                <Typography className="text-right">
                  <FiatValue value={item.fiatConversion == '0' ? null : item.fiatConversion} />
                </Typography>
              ),
            },
            balance: {
              rawValue: Number(item.balance) / 10 ** (item.tokenInfo.decimals ?? 0),
              content: (
                <Typography className={css.balanceColumn} data-testid="token-balance">
                  <TokenAmount value={item.balance} decimals={item.tokenInfo.decimals} />
                </Typography>
              ),
            },
            weight: {
              rawValue: itemShareOfFiatTotal,
              content: itemShareOfFiatTotal ? (
                <Typography className="text-right">{formatPercentage(itemShareOfFiatTotal)}</Typography>
              ) : (
                <></>
              ),
            },
            value: {
              rawValue: rawFiatValue,
              content: (
                <div className="text-right">
                  <Typography as="div">
                    <FiatBalance balanceItem={item} />
                  </Typography>
                  {item.fiatBalance24hChange && (
                    <Typography variant="paragraph-small">
                      <FiatChange balanceItem={item} inline />
                    </Typography>
                  )}
                </div>
              ),
            },
            actions: {
              rawValue: '',
              sticky: true,
              content: (
                <ActionButtons
                  tokenInfo={item.tokenInfo}
                  isSwapFeatureEnabled={isSwapFeatureEnabled ?? false}
                  onlyIcon
                  showHiddenAssets={showHiddenAssets}
                  isSelected={isSelected}
                  onToggleAsset={() => toggleAsset(item.tokenInfo.address)}
                />
              ),
            },
          },
        }
      })

  const isMobile = useIsMobile()

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
      ) : isMobile ? (
        // eslint-disable-next-line no-restricted-syntax -- transparent 4px border reserves space for the row hover outline; not a card surface
        <Card size="none" className="mb-4 border-4 border-transparent">
          <div className={css.mobileContainer}>
            <div className={css.mobileHeader}>
              <Typography variant="paragraph-small" color="muted">
                Asset
              </Typography>
              <Typography variant="paragraph-small" color="muted">
                Value
              </Typography>
            </div>
            {loading
              ? Array(3)
                  .fill(null)
                  .map((_, index) => (
                    <div key={index} className={css.mobileRow}>
                      <Skeleton className="h-[80px] w-full rounded-md" />
                    </div>
                  ))
              : (visibleAssets || []).map((item) => (
                  <div key={item.tokenInfo.address} className={css.mobileRow}>
                    <AssetRowContent
                      item={item}
                      chainId={chainId}
                      isStakingPromoEnabled={isStakingPromoEnabled ?? false}
                      isEarnPromoEnabled={isEarnPromoEnabled ?? false}
                      showMobileValue
                      showMobileBalance
                    />
                    <ActionButtons
                      tokenInfo={item.tokenInfo}
                      isSwapFeatureEnabled={isSwapFeatureEnabled ?? false}
                      mobile
                    />
                  </div>
                ))}
          </div>
          <div className="px-4 pt-4 pb-4">
            <HiddenTokensInfo onOpenManageTokens={onOpenManageTokens} />
          </div>
        </Card>
      ) : (
        // eslint-disable-next-line no-restricted-syntax -- transparent 4px border reserves space for the row hover outline; not a card surface
        <Card size="none" className="mb-4 border-4 border-transparent">
          <div className={classNames(css.container, { [css.containerWideActions]: showHiddenAssets })}>
            <EnhancedTable
              rows={rows}
              headCells={headCells}
              compact
              footer={<HiddenTokensInfo onOpenManageTokens={onOpenManageTokens} />}
            />
          </div>
        </Card>
      )}

      <CounterfactualCheckBalance />
    </>
  )
}

export default AssetsTable
