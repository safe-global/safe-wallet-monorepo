import { type ReactElement } from 'react'
import { Modal, Box, Typography, Stack, IconButton, useMediaQuery, Divider, Avatar, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { AppPosition } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import SendButton from '../AssetsTable/SendButton'
import SwapButton from '@/features/swap/components/SwapButton'
import StakeButton from '@/features/stake/components/StakeButton'
import EarnButton from '@/features/earn/components/EarnButton'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { STAKE_LABELS } from '@/services/analytics/events/stake'
import { EARN_LABELS } from '@/services/analytics/events/earn'
import useIsSwapFeatureEnabled from '@/features/swap/hooks/useIsSwapFeatureEnabled'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import ChainIndicator from '@/components/common/ChainIndicator'
import FiatValue from '@/components/common/FiatValue'
import PriceChart from './PriceChart'
import TokenTransactions from './TokenTransactions'
import css from './styles.module.css'

type AssetDetailsDrawerProps = {
  asset: Balance | AppPosition | null
  assetType: 'token' | 'position'
  isOpen: boolean
  onClose: () => void
}

/** Extract price change from either Balance or AppPosition types */
const getPriceChangeValue = (asset: Balance | AppPosition): number | null => {
  if ('priceChangePercentage1d' in asset && asset.priceChangePercentage1d != null) {
    return asset.priceChangePercentage1d
  }
  if ('fiatBalance24hChange' in asset && asset.fiatBalance24hChange) {
    return parseFloat(asset.fiatBalance24hChange) / 100
  }
  return null
}

/** Format price change as percentage string */
const formatPriceChange = (value: number | null): string | null => {
  if (value == null) return null
  const sign = value >= 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(2)}%`
}

/** Get token price from asset */
const getTokenPrice = (asset: Balance | AppPosition, assetType: 'token' | 'position'): number | null => {
  if (assetType === 'token' && 'price' in asset && typeof asset.price === 'number') {
    return asset.price
  }
  return null
}

/** Get fiat balance from asset */
const getFiatBalance = (asset: Balance | AppPosition, assetType: 'token' | 'position'): string => {
  if (assetType === 'token' && 'fiatBalance' in asset) {
    return asset.fiatBalance
  }
  if ('balanceFiat' in asset) {
    return asset.balanceFiat?.toString() || '0'
  }
  return '0'
}

const AssetDetailsDrawer = ({ asset, assetType, isOpen, onClose }: AssetDetailsDrawerProps): ReactElement => {
  const { breakpoints } = useTheme()
  const isMobile = useMediaQuery(breakpoints.down('md'))
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()

  if (!asset) {
    return <></>
  }

  const tokenInfo = asset.tokenInfo
  const balance = formatAmount(asset.balance)
  const priceChangeValue = getPriceChangeValue(asset)
  const priceChange = formatPriceChange(priceChangeValue)
  const tokenPrice = getTokenPrice(asset, assetType)
  const fiatBalance = getFiatBalance(asset, assetType)

  const drawerContent = (
    <Box className={css.container}>
      {/* Header */}
      <Box className={css.header}>
        <Stack direction="row" alignItems="center" gap={2} flex={1}>
          <Avatar src={tokenInfo.logoUri || undefined} alt={tokenInfo.symbol} className={css.avatar}>
            {tokenInfo.symbol[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {tokenInfo.name}
            </Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                {tokenInfo.symbol}
              </Typography>
              {'chainId' in tokenInfo && <ChainIndicator chainId={tokenInfo.chainId} inline />}
            </Stack>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Price Chart - only for tokens with assetId */}
      {assetType === 'token' && 'assetId' in tokenInfo && tokenInfo.assetId && (
        <>
          <PriceChart assetId={tokenInfo.assetId} currentPrice={tokenPrice} />
          <Divider />
        </>
      )}

      {/* Summary */}
      <Box className={css.summary}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Balance
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {balance} {tokenInfo.symbol}
            </Typography>
          </Box>

          {tokenPrice != null && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Price
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                <FiatValue value={tokenPrice.toString()} />
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Value
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              <FiatValue value={fiatBalance} precise />
            </Typography>
          </Box>

          {priceChange && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                24h Change
              </Typography>
              <Chip
                label={priceChange}
                size="small"
                color={priceChangeValue != null && priceChangeValue >= 0 ? 'success' : 'error'}
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          )}

          {assetType === 'position' && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Position Type
              </Typography>
              <Typography variant="body1">{(asset as AppPosition).type}</Typography>
            </Box>
          )}
        </Stack>
      </Box>

      <Divider />

      {/* Actions */}
      <Box className={css.actions}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Actions
        </Typography>
        <Stack spacing={1.5}>
          <SendButton tokenInfo={tokenInfo} light={false} />

          {isSwapFeatureEnabled && (
            <SwapButton tokenInfo={tokenInfo} amount={asset.balance} trackingLabel={SWAP_LABELS.asset} />
          )}

          <StakeButton tokenInfo={tokenInfo} trackingLabel={STAKE_LABELS.asset} compact={false} />

          <EarnButton tokenInfo={tokenInfo} trackingLabel={EARN_LABELS.asset} compact={false} />
        </Stack>
      </Box>

      {/* Transactions - only for tokens with address */}
      {assetType === 'token' && 'address' in tokenInfo && (
        <>
          <Divider />
          <TokenTransactions
            tokenAddress={tokenInfo.address}
            tokenSymbol={tokenInfo.symbol}
            tokenDecimals={tokenInfo.decimals}
          />
        </>
      )}
    </Box>
  )

  return (
    <Modal open={isOpen} onClose={onClose} className={css.modal}>
      <Box className={isMobile ? css.mobileSheet : css.desktopModal}>{drawerContent}</Box>
    </Modal>
  )
}

export default AssetDetailsDrawer
