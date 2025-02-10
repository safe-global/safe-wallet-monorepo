import CheckBalance from '@/features/counterfactual/CheckBalance'
import { type ReactElement } from 'react'
import { Box, IconButton, Checkbox, Skeleton, SvgIcon, Tooltip, Typography } from '@mui/material'
import type { TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import css from './styles.module.css'
import FiatValue from '@/components/common/FiatValue'
import TokenAmount from '@/components/common/TokenAmount'
import TokenIcon from '@/components/common/TokenIcon'
import EnhancedTable, { type EnhancedTableProps } from '@/components/common/EnhancedTable'
import TokenExplorerLink from '@/components/common/TokenExplorerLink'
import Track from '@/components/common/Track'
import { ASSETS_EVENTS } from '@/services/analytics/events/assets'
import InfoIcon from '@/public/images/notifications/info.svg'
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
  actions: {
    rawValue: '',
    sticky: true,
    content: <div></div>,
  },
}

const skeletonRows: EnhancedTableProps['rows'] = Array(3).fill({ cells: skeletonCells })

const isNativeToken = (tokenInfo: TokenInfo) => {
  return tokenInfo.type === TokenType.NATIVE_TOKEN
}

const headCells = [
  {
    id: 'asset',
    label: 'Asset',
    width: '60%',
  },
  {
    id: 'balance',
    label: 'Balance',
    width: '20%',
  },
  {
    id: 'value',
    label: 'Value',
    width: '20%',
    align: 'right',
  },
  {
    id: 'actions',
    label: '',
    width: '20%',
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
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const isStakingFeatureEnabled = useIsStakingFeatureEnabled()

  const { isAssetSelected, toggleAsset, hidingAsset, hideAsset, cancel, deselectAll, saveChanges } = useHideAssets(() =>
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
        const isNative = isNativeToken(item.tokenInfo)
        const isSelected = isAssetSelected(item.tokenInfo.address)

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

                  {!isNative && <TokenExplorerLink address={item.tokenInfo.address} />}
                </div>
              ),
            },
            balance: {
              rawValue: Number(item.balance) / 10 ** (item.tokenInfo.decimals ?? 0),
              collapsed: item.tokenInfo.address === hidingAsset,
              content: (
                <TokenAmount
                  value={item.balance}
                  decimals={item.tokenInfo.decimals}
                  tokenSymbol={item.tokenInfo.symbol}
                />
              ),
            },
            value: {
              rawValue: rawFiatValue,
              collapsed: item.tokenInfo.address === hidingAsset,
              content: (
                <Typography textAlign="right">
                  <FiatValue value={item.fiatBalance} />

                  {rawFiatValue === 0 && (
                    <Tooltip
                      title="Provided values are indicative and we are unable to accommodate pricing requests for individual assets"
                      placement="top"
                      arrow
                    >
                      <span>
                        <SvgIcon
                          component={InfoIcon}
                          inheritViewBox
                          color="error"
                          fontSize="small"
                          sx={{ verticalAlign: 'middle', ml: 0.5, mr: [0, '-20px'], mt: '-2px' }}
                        />
                      </span>
                    </Tooltip>
                  )}
                </Typography>
              ),
            },
            actions: {
              rawValue: '',
              sticky: true,
              collapsed: item.tokenInfo.address === hidingAsset,
              content: (
                <Box display="flex" flexDirection="row" gap={1} alignItems="center">
                  <>
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
                  </>
                </Box>
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
        <div className={css.container}>
          <EnhancedTable rows={rows} headCells={headCells} />
        </div>
      )}

      <CheckBalance />
    </>
  )
}

export default AssetsTable
