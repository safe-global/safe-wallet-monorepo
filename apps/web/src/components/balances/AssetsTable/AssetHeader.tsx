import { Box, Stack, Typography } from '@mui/material'
import TokenIcon from '@/components/common/TokenIcon'
import TokenAmount from '@/components/common/TokenAmount'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FiatBalance } from './FiatBalance'
import { FiatChange } from './FiatChange'
import SendButton from './SendButton'
import SwapButton from '@/features/swap/components/SwapButton'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { type ReactElement } from 'react'

interface AssetHeaderProps {
  item: Balance
  isSwapFeatureEnabled: boolean
}

const AssetHeader = ({ item, isSwapFeatureEnabled }: AssetHeaderProps): ReactElement => {
  return (
    <Stack direction="row" gap={1} alignItems="center" width={1} flexWrap="wrap">
      <TokenIcon logoUri={item.tokenInfo.logoUri} tokenSymbol={item.tokenInfo.symbol} size={32} />

      <Stack>
        <Typography fontWeight="bold">{item.tokenInfo.name}</Typography>
        <Typography variant="body2" sx={{ '& *': { fontWeight: 'normal', color: 'var(--color-primary-light)' } }}>
          <TokenAmount value={item.balance} decimals={item.tokenInfo.decimals} tokenSymbol={item.tokenInfo.symbol} />
        </Typography>
      </Stack>

      <Stack direction="column" alignItems="flex-end" ml="auto" mr={1}>
        <Typography fontWeight="bold">
          <FiatBalance balanceItem={item} />
        </Typography>
        {item.fiatBalance24hChange && (
          <Typography variant="caption">
            <FiatChange balanceItem={item} inline />
          </Typography>
        )}
      </Stack>

      <Stack
        direction="row"
        gap={1}
        alignItems="center"
        sx={{
          ml: { xs: 0, sm: 1 },
          mr: 1,
          width: { xs: '100%', sm: 'auto' },
          mt: { xs: 1, sm: 0 },
        }}
      >
        <Box sx={{ flex: { xs: '1 1 0', sm: 'initial' }, minWidth: 0 }}>
          <SendButton tokenInfo={item.tokenInfo} light />
        </Box>
        {isSwapFeatureEnabled && (
          <Box sx={{ flex: { xs: '1 1 0', sm: 'initial' }, minWidth: 0 }}>
            <SwapButton tokenInfo={item.tokenInfo} amount="0" trackingLabel={SWAP_LABELS.asset} light />
          </Box>
        )}
      </Stack>
    </Stack>
  )
}

export default AssetHeader
