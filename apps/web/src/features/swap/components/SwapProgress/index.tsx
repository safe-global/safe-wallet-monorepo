import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { getFilledAmount, getFilledPercentage } from '@/features/swap/helpers/utils'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { SwapProgressView } from '@views/features/swap/components/SwapProgress/SwapProgressView'

const SwapProgress = ({ order }: { order: OrderTransactionInfo }) => {
  const filledPercentage = getFilledPercentage(order)
  const filledAmount = formatAmount(getFilledAmount(order))

  const progressValue = Math.min(Math.max(Number(filledPercentage), 0), 100)

  const isSellOrder = order.kind === 'sell'
  const tokenSymbol = isSellOrder ? order.sellToken.symbol : order.buyToken.symbol

  return <SwapProgressView progressValue={progressValue} filledAmount={filledAmount} tokenSymbol={tokenSymbol} />
}

export default SwapProgress
