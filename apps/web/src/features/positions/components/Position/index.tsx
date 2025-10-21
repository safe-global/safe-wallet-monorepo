import IframeIcon from '@/components/common/IframeIcon'
import { Box, Stack, Typography } from '@mui/material'
import FiatValue from '@/components/common/FiatValue'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import type { AppPosition } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'

const Position = ({ item }: { item: AppPosition }) => {
  return (
    <Stack direction="row" alignItems="center" key={item.tokenInfo.name} py={1} gap={1}>
      <IframeIcon src={item.tokenInfo.logoUrl || ''} alt={item.tokenInfo.name + ' icon'} width={32} height={32} />

      <Box>
        <Typography fontWeight="bold">{item.name}</Typography>
        <Typography variant="body2" color="primary.light">
          {formatAmount(item.balance)} {item.tokenInfo.symbol} •&nbsp;
          {item.type}
        </Typography>
      </Box>

      <Box justifySelf="flex-end" ml="auto" textAlign="right">
        <Typography>
          <FiatValue value={item.balanceFiat?.toString() || '0'} />
        </Typography>
        <Typography variant="caption">
          <FiatChange change={item.priceChangePercentage1d} inline />
        </Typography>
      </Box>
    </Stack>
  )
}

export default Position
