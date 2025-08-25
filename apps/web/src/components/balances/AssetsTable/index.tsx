import CheckBalance from '@/features/counterfactual/CheckBalance'
import React, { type ReactElement } from 'react'
import { Box, Card, Checkbox, CircularProgress, IconButton, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import css from './styles.module.css'
import TokenAmount from '@/components/common/TokenAmount'
import TokenIcon from '@/components/common/TokenIcon'
import EnhancedTable, { type EnhancedTableProps } from '@/components/common/EnhancedTable'
import TokenExplorerLink from '@/components/common/TokenExplorerLink'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS } from '@/services/analytics/events/assets'
import { VisibilityOutlined } from '@mui/icons-material'
import TokenMenu from '../TokenMenu'
import useBalances from '@/hooks/useBalances'
import { useHideAssets, useVisibleAssets } from './useHideAssets'
import AddFundsCTA from '@/components/common/AddFunds'
import SwapButton from '@/features/swap/components/SwapButton'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import SendButton from './SendButton'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'
import useIsStakingFeatureEnabled from '@/features/stake/hooks/useIsStakingFeatureEnabled'
import { STAKE_LABELS } from '@/services/analytics/events/stake'
import StakeButton from '@/features/stake/components/StakeButton'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FiatChange } from './FiatChange'
import useIsEarnFeatureEnabled from '@/features/earn/hooks/useIsEarnFeatureEnabled'
import EarnButton from '@/features/earn/components/EarnButton'
import { EARN_LABELS } from '@/services/analytics/events/earn'
import { isEligibleEarnToken } from '@/features/earn/utils'
import useChainId from '@/hooks/useChainId'
import FiatValue from '@/components/common/FiatValue'
import { formatPercentage } from '@safe-global/utils/utils/formatters'

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
  value: {
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
  actions: {
    rawValue: '',
    sticky: true,
    content: <div></div>,
  },
}

const skeletonRows: EnhancedTableProps['rows'] = Array(3).fill({ cells: skeletonCells })

const isNativeToken = (tokenInfo: Balance['tokenInfo']) => {
  return tokenInfo.type === TokenType.NATIVE_TOKEN
}

const headCells = [
  {
    id: 'asset',
    label: 'Asset',
    width: '40%',
  },
  {
    id: 'price',
    label: 'Price',
    width: '15%',
    align: 'left',
  },
  {
    id: 'balance',
    label: 'Balance',
    width: '15%',
  },
  {
    id: 'value',
    label: 'Value',
    width: '15%',
    align: 'left',
  },
  {
    id: 'weight',
    label: 'Weight',
    width: '15%',
    align: 'left',
  },
  {
    id: 'actions',
    label: '',
    width: '15%',
    sticky: true,
  },
]

const AssetsTable = ({
  showHiddenAssets,
  setShowHiddenAssets,
}: {
  showHiddenAssets: boolean
  setShowHiddenAssets: (hidden: boolean) => void
}): ReactElement => {
  const { balances, loading } = useBalances()
  const chainId = useChainId()
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isStakingFeatureEnabled = useIsStakingFeatureEnabled()
  const isEarnFeatureEnabled = useIsEarnFeatureEnabled()

  const { isAssetSelected, toggleAsset, hidingAsset, hideAsset, cancel, deselectAll, saveChanges } = useHideAssets(() =>
    setShowHiddenAssets(false),
  )

  const visible = useVisibleAssets()
  const visibleAssets = showHiddenAssets ? balances.items : visible
  const hasNoAssets = !loading && balances.items.length === 1 && balances.items[0].balance === '0'
  const selectedAssetCount = visibleAssets?.filter((item) => isAssetSelected(item.tokenInfo.address)).length || 0

  const fiatTotal = balances.fiatTotal ? Number(balances.fiatTotal) : null

  const rows = loading
    ? skeletonRows
    : (visibleAssets || []).map((item) => {
        const rawFiatValue = parseFloat(item.fiatBalance)
        const rawPriceValue = parseFloat(item.fiatConversion)
        const isNative = isNativeToken(item.tokenInfo)
        const isSelected = isAssetSelected(item.tokenInfo.address)
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
                <div className={css.token}>
                  <TokenIcon logoUri={item.tokenInfo.logoUri} tokenSymbol={item.tokenInfo.symbol} />

                  <Typography>{item.tokenInfo.name}</Typography>

                  {isStakingFeatureEnabled && item.tokenInfo.type === TokenType.NATIVE_TOKEN && (
                    <StakeButton tokenInfo={item.tokenInfo} trackingLabel={STAKE_LABELS.asset} />
                  )}

                  {isEarnFeatureEnabled && isEligibleEarnToken(chainId, item.tokenInfo.address) && (
                    <EarnButton tokenInfo={item.tokenInfo} trackingLabel={EARN_LABELS.asset} />
                  )}

                  {!isNative && <TokenExplorerLink address={item.tokenInfo.address} />}
                </div>
              ),
            },
            price: {
              rawValue: rawPriceValue,
              content: (
                <Typography>
                  <FiatValue value={item.fiatConversion} />
                </Typography>
              ),
            },
            balance: {
              rawValue: Number(item.balance) / 10 ** (item.tokenInfo.decimals ?? 0),
              collapsed: item.tokenInfo.address === hidingAsset,
              content: (
                <Typography sx={{ '& b': { fontWeight: '400' } }}>
                  <TokenAmount
                    value={item.balance}
                    decimals={item.tokenInfo.decimals}
                    tokenSymbol={item.tokenInfo.symbol}
                  />
                </Typography>
              ),
            },
            value: {
              rawValue: rawFiatValue,
              collapsed: item.tokenInfo.address === hidingAsset,
              content: (
                <Box textAlign="left">
                  <Typography>
                    <FiatValue value={item.fiatBalance} />
                  </Typography>
                  {item.fiatBalance24hChange && (
                    <Typography variant="caption">
                      <FiatChange balanceItem={item} inline />
                    </Typography>
                  )}
                </Box>
              ),
            },
            weight: {
              rawValue: itemShareOfFiatTotal,
              content: itemShareOfFiatTotal ? (
                <Stack direction="row" alignItems="center" gap={1} position="relative">
                  <svg className={css.gradient}>
                    <defs>
                      <linearGradient
                        id="progress_gradient"
                        x1="21.1648"
                        y1="8.21591"
                        x2="-9.95028"
                        y2="22.621"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#5FDDFF" />
                        <stop offset="1" stopColor="#12FF80" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    className={css.circleBg}
                    size={16}
                    thickness={6}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={itemShareOfFiatTotal * 100}
                    className={css.circleProgress}
                    size={16}
                    thickness={6}
                    sx={{ 'svg circle': { stroke: 'url(#progress_gradient)', strokeLinecap: 'round' } }}
                  />
                  <Typography variant="body2">{formatPercentage(itemShareOfFiatTotal)}</Typography>
                </Stack>
              ) : (
                <></>
              ),
            },
            actions: {
              rawValue: Number(item.fiatBalance24hChange),
              sticky: true,
              collapsed: item.tokenInfo.address === hidingAsset,
              content: (
                <Stack direction="row" gap={1} alignItems="center" justifyContent="flex-end">
                  <Stack direction="row" gap={1} alignItems="center" bgcolor="background.paper" p={1}>
                    <SendButton tokenInfo={item.tokenInfo} />

                    {isSwapFeatureEnabled && (
                      <SwapButton tokenInfo={item.tokenInfo} amount="0" trackingLabel={SWAP_LABELS.asset} />
                    )}

                    {showHiddenAssets ? (
                      <Checkbox size="small" checked={isSelected} onClick={() => toggleAsset(item.tokenInfo.address)} />
                    ) : (
                      <Track {...ASSETS_EVENTS.HIDE_TOKEN}>
                        <Tooltip title="Hide asset" arrow disableInteractive>
                          <IconButton
                            disabled={hidingAsset !== undefined}
                            size="medium"
                            onClick={() => hideAsset(item.tokenInfo.address)}
                          >
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Track>
                    )}
                  </Stack>
                </Stack>
              ),
            },
          },
        }
      })

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
        <Card sx={{ px: 2, mb: 2 }}>
          <div className={css.container}>
            <EnhancedTable rows={rows} headCells={headCells} compact />
          </div>
        </Card>
      )}

      <CheckBalance />
    </>
  )
}

export default AssetsTable
