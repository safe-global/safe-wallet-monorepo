import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { getFilledAmount, getFilledPercentage } from '@/features/swap/helpers/utils'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { Progress } from '@/components/ui/progress'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

const SwapProgress = ({ order }: { order: OrderTransactionInfo }) => {
  const filledPercentage = getFilledPercentage(order)
  const filledAmount = formatAmount(getFilledAmount(order))

  const progressValue = Math.min(Math.max(Number(filledPercentage), 0), 100)
  const isFilled = progressValue >= 100
  const colorVar = isFilled ? 'var(--color-success-main)' : 'var(--color-warning-main)'

  const isSellOrder = order.kind === 'sell'
  const tokenSymbol = isSellOrder ? order.sellToken.symbol : order.buyToken.symbol

  return (
    <div className="flex flex-row items-center gap-2">
      <Progress
        value={progressValue}
        className={cn(
          'w-[100px] [&_[data-slot=progress-track]]:rounded-md [&_[data-slot=progress-indicator]]:rounded-md',
          isFilled
            ? '[&_[data-slot=progress-indicator]]:bg-[var(--color-success-main)]'
            : '[&_[data-slot=progress-indicator]]:bg-[var(--color-warning-main)]',
        )}
      />
      <Typography style={{ color: colorVar }}>{progressValue} %</Typography>
      <Typography>
        <span className="font-bold">
          {filledAmount} {tokenSymbol}
        </span>{' '}
        sold
      </Typography>
    </div>
  )
}

export default SwapProgress
