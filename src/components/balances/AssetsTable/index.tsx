import CheckBalance from '@/features/counterfactual/CheckBalance'
import { type ReactElement, useMemo, useContext } from 'react'
import { Button, Tooltip, Typography, SvgIcon, IconButton, Box, Checkbox, Skeleton } from '@mui/material'
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
import useHiddenTokens from '@/hooks/useHiddenTokens'
import { useHideAssets } from './useHideAssets'
import CheckWallet from '@/components/common/CheckWallet'
import useSpendingLimit from '@/hooks/useSpendingLimit'
import { TxModalContext } from '@/components/tx-flow'
import { TokenTransferFlow } from '@/components/tx-flow/flows'
import AddFundsCTA from '@/components/common/AddFunds'

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
  },
  {
    id: 'actions',
    label: '',
    width: '20%',
    sticky: true,
  },
]

const SendButton = ({
  tokenInfo,
  onClick,
}: {
  tokenInfo: TokenInfo
  onClick: (tokenAddress: string) => void
}): ReactElement => {
  const spendingLimit = useSpendingLimit(tokenInfo)

  return (
    <CheckWallet allowSpendingLimit={!!spendingLimit}>
      {(isOk) => (
        <Track {...ASSETS_EVENTS.SEND}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => onClick(tokenInfo.address)}
            disabled={!isOk}
          >
            Send
          </Button>
        </Track>
      )}
    </CheckWallet>
  )
}

const AssetsTable = ({
  showHiddenAssets,
  setShowHiddenAssets,
}: {
  showHiddenAssets: boolean
  setShowHiddenAssets: (hidden: boolean) => void
}): ReactElement => {
  const hiddenAssets = useHiddenTokens()
  const { balances, loading } = useBalances()
  const { setTxFlow } = useContext(TxModalContext)

  const { isAssetSelected, toggleAsset, hidingAsset, hideAsset, cancel, deselectAll, saveChanges } = useHideAssets(() =>
    setShowHiddenAssets(false),
  )

  const visibleAssets = useMemo(() => balances.items, [balances.items])

  const hasNoAssets = !loading && balances.items.length === 1 && balances.items[0].balance === '0'

  const selectedAssetCount = visibleAssets?.filter((item) => isAssetSelected(item.tokenInfo.address)).length || 0

  const onSendClick = (tokenAddress: string) => {
    setTxFlow(<TokenTransferFlow tokenAddress={tokenAddress} />)
  }

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

                  {!isNative && <TokenExplorerLink address={item.tokenInfo.address} />}
                </div>
              ),
            },
            balance: {
              rawValue: Number(item.balance) / 10 ** item.tokenInfo.decimals,
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
                <>
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
                          sx={{ verticalAlign: 'middle', marginLeft: 0.5 }}
                        />
                      </span>
                    </Tooltip>
                  )}
                </>
              ),
            },
            actions: {
              rawValue: '',
              sticky: true,
              collapsed: item.tokenInfo.address === hidingAsset,
              content: (
                <Box display="flex" flexDirection="row" gap={1} alignItems="center">
                  <>
                    <SendButton tokenInfo={item.tokenInfo} onClick={() => onSendClick(item.tokenInfo.address)} />

                    {showHiddenAssets ? (
                      <Checkbox size="small" checked={isSelected} onClick={() => toggleAsset(item.tokenInfo.address)} />
                    ) : null}
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
