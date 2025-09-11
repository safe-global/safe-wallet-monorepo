import IframeIcon from '@/components/common/IframeIcon'
import { Box, Stack, Typography } from '@mui/material'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import FiatValue from '@/components/common/FiatValue'
import { FiatChange } from '@/components/balances/AssetsTable/FiatChange'
import type { Position } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { getReadablePositionType } from '@/features/positions/utils'

const Position = ({ item }: { item: Position }) => {
  return (
    <Stack direction="row" alignItems="center" key={item.tokenInfo.name} py={1} gap={1}>
      <IframeIcon src={item.tokenInfo.logoUri || ''} alt={item.tokenInfo.name + ' icon'} width={32} height={32} />

      <Box>
        <Typography fontWeight="bold">{item.tokenInfo.name}</Typography>
        <Typography variant="body2" color="primary.light">
          {formatVisualAmount(item.balance, item.tokenInfo.decimals)} {item.tokenInfo.symbol} •&nbsp;
          {getReadablePositionType(item.position_type)}
        </Typography>
      </Box>

      <Box justifySelf="flex-end" ml="auto" textAlign="right">
        <Typography>
          <FiatValue value={item.fiatBalance} />
        </Typography>
        <Typography variant="caption">
          <FiatChange balanceItem={item} inline />
        </Typography>
      </Box>
    </Stack>
  )
}

export default Position
