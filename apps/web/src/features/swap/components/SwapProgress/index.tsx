import { getFilledAmount, getFilledPercentage } from '@/features/swap/helpers/utils'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { LinearProgress, Stack, Typography } from '@mui/material'
import type { Order } from '@safe-global/safe-gateway-typescript-sdk'

const SwapProgress = ({ order }: { order: Order }) => {
  const filledPercentage = getFilledPercentage(order)
  const filledAmount = formatAmount(getFilledAmount(order))

  const progressValue = Math.min(Math.max(Number(filledPercentage), 0), 100)
  const isFilled = progressValue >= 100
  const color = isFilled ? 'success' : 'warning'

  const isSellOrder = order.kind === 'sell'
  const tokenSymbol = isSellOrder ? order.sellToken.symbol : order.buyToken.symbol

  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <LinearProgress
        variant="determinate"
        value={progressValue}
        sx={{ width: '100px', borderRadius: '6px' }}
        color={color}
      />
      <Typography color={`${color}.main`}>{progressValue} %</Typography>
      <Typography>
        <Typography component="span" fontWeight="bold">
          {filledAmount} {tokenSymbol}
        </Typography>{' '}
        sold
      </Typography>
    </Stack>
  )
}

export default SwapProgress
