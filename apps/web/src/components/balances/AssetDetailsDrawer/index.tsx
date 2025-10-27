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
import css from './styles.module.css'

type AssetDetailsDrawerProps = {
  asset: Balance | AppPosition | null
  assetType: 'token' | 'position'
  isOpen: boolean
  onClose: () => void
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

  // Handle different price change fields: Balance uses fiatBalance24hChange (string), AppPosition uses priceChangePercentage1d (number)
  const priceChangeValue =
    'priceChangePercentage1d' in asset && asset.priceChangePercentage1d != null
      ? asset.priceChangePercentage1d
      : 'fiatBalance24hChange' in asset && asset.fiatBalance24hChange
        ? parseFloat(asset.fiatBalance24hChange) / 100 // Convert from string percentage to decimal
        : null

  const priceChange =
    priceChangeValue != null ? `${priceChangeValue >= 0 ? '+' : ''}${(priceChangeValue * 100).toFixed(2)}%` : null

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

          {assetType === 'token' && 'price' in asset && asset.price != null && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Price
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                <FiatValue value={asset.price.toString()} />
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Value
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {assetType === 'token' && 'fiatBalance' in asset ? (
                <FiatValue value={asset.fiatBalance} precise />
              ) : 'balanceFiat' in asset ? (
                <FiatValue value={asset.balanceFiat?.toString() || '0'} precise />
              ) : (
                <FiatValue value="0" precise />
              )}
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
    </Box>
  )

  return (
    <Modal open={isOpen} onClose={onClose} className={css.modal}>
      <Box className={isMobile ? css.mobileSheet : css.desktopModal}>{drawerContent}</Box>
    </Modal>
  )
}

export default AssetDetailsDrawer
