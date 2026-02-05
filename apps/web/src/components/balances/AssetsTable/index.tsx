import { CounterfactualFeature } from '@/features/counterfactual'
import { useLoadFeature } from '@/features/__core__'
import React, { type ReactElement } from 'react'
import { Box, Card, Skeleton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material'
import classNames from 'classnames'
import css from './styles.module.css'
import EnhancedTable, { type EnhancedTableProps } from '@/components/common/EnhancedTable'
import TokenMenu from '../TokenMenu'
import useBalances from '@/hooks/useBalances'
import { useHideAssets, useVisibleAssets } from './useHideAssets'
import AddFundsCTA from '@/components/common/AddFunds'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'
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
        <Skeleton variant="rounded" width="26px" height="26px" />
        <Typography>
          <Skeleton width="80px" />
        </Typography>
      </div>
    ),
  },
  price: {
    rawValue: '0',
    content: (
      <Typography>
        <Skeleton width="32px" />
      </Typography>
    ),
  },
  balance: {
    rawValue: '0',
    content: (
      <Typography>
        <Skeleton width="32px" />
      </Typography>
    ),
  },
  weight: {
    rawValue: '0',
    content: (
      <Typography>
        <Skeleton width="32px" />
      </Typography>
    ),
  },
  value: {
    rawValue: '0',
    content: (
      <Typography>
        <Skeleton width="32px" />
      </Typography>
    ),
  },
  actions: {
    rawValue: '',
    sticky: true,
    content: (
      <Stack direction="row" gap={1} justifyContent="flex-end">
        <Skeleton variant="rounded" width={28} height={28} />
        <Skeleton variant="rounded" width={28} height={28} />
        <Skeleton variant="rounded" width={24} height={24} />
      </Stack>
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
        <Tooltip title="Based on total portfolio value">
          <span>Weight</span>
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
                <Box>
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
                </Box>
              ),
            },
            price: {
              rawValue: rawPriceValue,
              content: (
                <Typography textAlign="right">
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
                <Typography textAlign="right">{formatPercentage(itemShareOfFiatTotal)}</Typography>
              ) : (
                <></>
              ),
            },
            value: {
              rawValue: rawFiatValue,
              content: (
                <Box textAlign="right">
                  <Typography>
                    <FiatBalance balanceItem={item} />
                  </Typography>
                  {item.fiatBalance24hChange && (
                    <Typography variant="body2">
                      <FiatChange balanceItem={item} inline />
                    </Typography>
                  )}
                </Box>
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

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

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
        <Card sx={{ mb: 2, border: '4px solid transparent' }}>
          <Box className={css.mobileContainer}>
            <Box className={css.mobileHeader}>
              <Typography variant="body2" color="text.secondary">
                Asset
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Value
              </Typography>
            </Box>
            {loading
              ? Array(3)
                  .fill(null)
                  .map((_, index) => (
                    <Box key={index} className={css.mobileRow}>
                      <Skeleton variant="rounded" width="100%" height={80} />
                    </Box>
                  ))
              : (visibleAssets || []).map((item) => (
                  <Box key={item.tokenInfo.address} className={css.mobileRow}>
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
                  </Box>
                ))}
          </Box>
          <Box sx={{ pt: 2, pb: 2, px: '16px' }}>
            <HiddenTokensInfo onOpenManageTokens={onOpenManageTokens} />
          </Box>
        </Card>
      ) : (
        <Card sx={{ mb: 2, border: '4px solid transparent' }}>
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
