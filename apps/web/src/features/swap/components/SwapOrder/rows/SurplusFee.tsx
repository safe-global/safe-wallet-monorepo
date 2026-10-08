import type { TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getOrderFeeBps } from '@safe-global/utils/features/swap/helpers/utils'
import { SurplusFeeView } from '@views/features/swap/components/SwapOrder/rows/SurplusFeeView'

export const SurplusFee = ({
  order,
}: {
  order: Pick<TwapOrderTransactionInfo, 'fullAppData' | 'executedFee' | 'executedFeeToken'>
}) => {
  const bps = getOrderFeeBps(order)
  const { executedFee, executedFeeToken } = order

  if (!executedFee || executedFee === '0') {
    return null
  }

  return <SurplusFeeView bps={bps} executedFee={executedFee} executedFeeToken={executedFeeToken} />
}
