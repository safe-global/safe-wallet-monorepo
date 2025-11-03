import CheckBalance from '@/features/counterfactual/CheckBalance'
import React, { type ReactElement } from 'react'
import { Box, Card, Checkbox, Skeleton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material'
import classNames from 'classnames'
import css from './styles.module.css'
import TokenAmount from '@/components/common/TokenAmount'
import TokenIcon from '@/components/common/TokenIcon'
import EnhancedTable, { type EnhancedTableProps } from '@/components/common/EnhancedTable'
import TokenExplorerLink from '@/components/common/TokenExplorerLink'
import TokenMenu from '../TokenMenu'
import useBalances from '@/hooks/useBalances'
import { useHideAssets, useVisibleAssets } from './useHideAssets'
import AddFundsCTA from '@/components/common/AddFunds'
import SwapButton from '@/features/swap/components/SwapButton'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import SendButton from './SendButton'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'
// Debug: Feature flags disabled to always show buttons
// import { useIsEarnPromoEnabled } from '@/features/earn/hooks/useIsEarnFeatureEnabled'
// import useIsStakingPromoEnabled from '@/features/stake/hooks/useIsStakingBannerEnabled'
import { STAKE_LABELS } from '@/services/analytics/events/stake'
import StakeButton from '@/features/stake/components/StakeButton'
import { TokenType } from '@safe-global/store/gateway/types'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FiatChange } from './FiatChange'
import { FiatBalance } from './FiatBalance'
import EarnButton from '@/features/earn/components/EarnButton'
import { EARN_LABELS } from '@/services/analytics/events/earn'
import { isEligibleEarnToken } from '@/features/earn/utils'
import useChainId from '@/hooks/useChainId'
import FiatValue from '@/components/common/FiatValue'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'

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

const isNativeToken = (tokenInfo: Balance['tokenInfo']) => {
  return tokenInfo.type === TokenType.NATIVE_TOKEN
}

const AssetsTable = ({
  showHiddenAssets,
  setShowHiddenAssets,
}: {
  showHiddenAssets: boolean
  setShowHiddenAssets: (hidden: boolean) => void
}): ReactElement => {
  const headCells = [
    {
      id: 'asset',
      label: 'Asset',
      width: '23%',
    },
    {
      id: 'price',
      label: 'Price',
      width: '18%',
      align: 'right',
    },
    {
      id: 'balance',
      label: 'Balance',
      width: '18%',
      align: 'right',
    },
    {
      id: 'weight',
      label: (
        <Tooltip title="Based on total portfolio value">
          <Typography variant="caption" letterSpacing="normal" color="primary.light">
            Weight
          </Typography>
        </Tooltip>
      ),
      width: '23%',
      align: 'right',
    },
    {
      id: 'value',
      label: 'Value',
      width: '18%',
      align: 'right',
    },
    {
      id: 'actions',
      label: '',
      width: showHiddenAssets ? '120px' : '76px',
      align: 'right',
      disableSort: true,
    },
  ]
  const { balances, loading } = useBalances()
  const { balances: visibleBalances } = useVisibleBalances()

  const chainId = useChainId()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  // Debug: Feature flags disabled to always show buttons
  // const isStakingPromoEnabled = useIsStakingPromoEnabled()
  // const isEarnPromoEnabled = useIsEarnPromoEnabled()

  const { isAssetSelected, toggleAsset, hidingAsset, cancel, deselectAll, saveChanges } = useHideAssets(() =>
    setShowHiddenAssets(false),
  )

  const visible = useVisibleAssets()
  const visibleAssets = showHiddenAssets ? balances.items : visible
  const hasNoAssets = !loading && balances.items.length === 1 && balances.items[0].balance === '0'
  const selectedAssetCount = visibleAssets?.filter((item) => isAssetSelected(item.tokenInfo.address)).length || 0

  const rows = loading
    ? skeletonRows
    : (visibleAssets || []).map((item) => {
        const rawFiatValue = parseFloat(item.fiatBalance)
        const rawPriceValue = parseFloat(item.fiatConversion)
        const isNative = isNativeToken(item.tokenInfo)
        const isSelected = isAssetSelected(item.tokenInfo.address)
        const fiatTotal = visibleBalances.fiatTotal ? Number(visibleBalances.fiatTotal) : undefined
        const itemShareOfFiatTotal = fiatTotal ? Number(item.fiatBalance) / fiatTotal : null

        return {
          key: item.tokenInfo.address,
          selected: isSelected,
          collapsed: item.tokenInfo.address === hidingAsset,
          cells: {
            asset: {
              rawValue: item.tokenInfo.name,
              collapsed: item.tokenInfo.address === hidingAsset,
              content: (
                <Box>
                  <Box className={css.mobileAssetRow}>
                    <div className={css.token}>
                      <TokenIcon logoUri={item.tokenInfo.logoUri} tokenSymbol={item.tokenInfo.symbol} />

                      <Stack>
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                          <Typography component="span" fontWeight="bold">
                            {item.tokenInfo.name}
                            {!isNative && <TokenExplorerLink address={item.tokenInfo.address} />}
                          </Typography>
                          {/* Debug: Always show buttons, remove feature flag checks */}
                          {item.tokenInfo.type === TokenType.NATIVE_TOKEN && (
                            <StakeButton tokenInfo={item.tokenInfo} trackingLabel={STAKE_LABELS.asset} plain />
                          )}
                          {isEligibleEarnToken(chainId, item.tokenInfo.address) && (
                            <EarnButton tokenInfo={item.tokenInfo} trackingLabel={EARN_LABELS.asset} plain />
                          )}
                        </Box>
                        <Typography
                          variant="body2"
                          color="primary.light"
                          className={css.mobileBalance}
                          fontWeight="normal"
                        >
                          <TokenAmount
                            value={item.balance}
                            decimals={item.tokenInfo.decimals}
                            tokenSymbol={item.tokenInfo.symbol}
                          />
                        </Typography>
                        <Typography variant="body2" color="primary.light" className={css.desktopSymbol}>
                          {item.tokenInfo.symbol}
                        </Typography>
                      </Stack>
                    </div>
                    <Box className={css.mobileValue}>
                      <Typography>
                        <FiatBalance balanceItem={item} />
                      </Typography>
                      {item.fiatBalance24hChange && (
                        <Typography variant="caption">
                          <FiatChange balanceItem={item} inline />
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Stack direction="row" className={css.mobileButtons}>
                    <SendButton tokenInfo={item.tokenInfo} />

                    {isSwapFeatureEnabled && (
                      <SwapButton tokenInfo={item.tokenInfo} amount="0" trackingLabel={SWAP_LABELS.asset} />
                    )}
                  </Stack>
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
              collapsed: item.tokenInfo.address === hidingAsset,
              content: (
                <Typography sx={{ '& b': { fontWeight: '400' } }} textAlign="right">
                  <TokenAmount
                    value={item.balance}
                    decimals={item.tokenInfo.decimals}
                    tokenSymbol={item.tokenInfo.symbol}
                  />
                </Typography>
              ),
            },
            weight: {
              rawValue: itemShareOfFiatTotal,
              content: itemShareOfFiatTotal ? (
                <Box textAlign="right">
                  <Stack direction="row" alignItems="center" gap={0.5} position="relative" display="inline-flex">
                    <div className={css.customProgress}>
                      <div
                        className={css.progressRing}
                        style={
                          {
                            '--progress': `${(itemShareOfFiatTotal * 100).toFixed(1)}%`,
                          } as React.CSSProperties & { '--progress': string }
                        }
                      />
                    </div>
                    <Typography variant="body2" sx={{ minWidth: '52px', textAlign: 'right' }}>
                      {formatPercentage(itemShareOfFiatTotal)}
                    </Typography>
                  </Stack>
                </Box>
              ) : (
                <></>
              ),
            },
            value: {
              rawValue: rawFiatValue,
              collapsed: item.tokenInfo.address === hidingAsset,
              content: (
                <Box textAlign="right">
                  <Typography>
                    <FiatBalance balanceItem={item} />
                  </Typography>
                  {item.fiatBalance24hChange && (
                    <Typography variant="caption">
                      <FiatChange balanceItem={item} inline />
                    </Typography>
                  )}
                </Box>
              ),
            },
            actions: {
              rawValue: '',
              sticky: true,
              collapsed: item.tokenInfo.address === hidingAsset,
              content: (
                <Stack
                  direction="row"
                  gap={1}
                  alignItems="center"
                  justifyContent="flex-end"
                  mr={-1}
                  className={css.sticky}
                >
                  <SendButton tokenInfo={item.tokenInfo} onlyIcon />

                  {isSwapFeatureEnabled && (
                    <SwapButton tokenInfo={item.tokenInfo} amount="0" trackingLabel={SWAP_LABELS.asset} onlyIcon />
                  )}

                  {showHiddenAssets && (
                    <Checkbox size="small" checked={isSelected} onClick={() => toggleAsset(item.tokenInfo.address)} />
                  )}
                </Stack>
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
        <Card sx={{ px: 2, mb: 2 }}>
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
              : (visibleAssets || []).map((item) => {
                  const isNative = isNativeToken(item.tokenInfo)
                  return (
                    <Box key={item.tokenInfo.address} className={css.mobileRow}>
                      <Box className={css.mobileAssetRow}>
                        <div className={css.token}>
                          <TokenIcon logoUri={item.tokenInfo.logoUri} tokenSymbol={item.tokenInfo.symbol} />

                          <Stack>
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                              <Typography component="span" fontWeight="bold">
                                {item.tokenInfo.name}
                                {!isNative && <TokenExplorerLink address={item.tokenInfo.address} />}
                              </Typography>
                              {/* Debug: Always show buttons, remove feature flag checks */}
                              {item.tokenInfo.type === TokenType.NATIVE_TOKEN && (
                                <StakeButton tokenInfo={item.tokenInfo} trackingLabel={STAKE_LABELS.asset} plain />
                              )}
                              {isEligibleEarnToken(chainId, item.tokenInfo.address) && (
                                <EarnButton tokenInfo={item.tokenInfo} trackingLabel={EARN_LABELS.asset} plain />
                              )}
                            </Box>
                            <Typography variant="body2" color="primary.light" className={css.mobileBalance}>
                              <TokenAmount
                                value={item.balance}
                                decimals={item.tokenInfo.decimals}
                                tokenSymbol={item.tokenInfo.symbol}
                              />
                            </Typography>
                          </Stack>
                        </div>
                        <Box className={css.mobileValue}>
                          <Typography>
                            <FiatBalance balanceItem={item} />
                          </Typography>
                          {item.fiatBalance24hChange && (
                            <Typography variant="caption">
                              <FiatChange balanceItem={item} inline />
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Stack direction="row" className={css.mobileButtons}>
                        <Box className={css.mobileButtonWrapper}>
                          <SendButton tokenInfo={item.tokenInfo} />
                        </Box>

                        {isSwapFeatureEnabled && (
                          <Box className={css.mobileButtonWrapper}>
                            <SwapButton tokenInfo={item.tokenInfo} amount="0" trackingLabel={SWAP_LABELS.asset} />
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  )
                })}
          </Box>
        </Card>
      ) : (
        <Card sx={{ px: 2, mb: 2 }}>
          <div className={classNames(css.container, { [css.containerWideActions]: showHiddenAssets })}>
            <EnhancedTable rows={rows} headCells={headCells} compact />
          </div>
        </Card>
      )}

      <CheckBalance />
    </>
  )
}

export default AssetsTable
