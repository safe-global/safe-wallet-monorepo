import type {
  SwapOrderTransactionInfo,
  TwapOrderTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getOrderFeeBps } from '@safe-global/utils/features/swap/helpers/utils'
import { BRAND_NAME } from '@/config/constants'
import { OrderFeeConfirmationViewView } from '@views/features/swap/components/SwapOrderConfirmationView/OrderFeeConfirmationViewView'

export const OrderFeeConfirmationView = ({
  order,
}: {
  order: Pick<SwapOrderTransactionInfo | TwapOrderTransactionInfo, 'fullAppData'>
}) => {
  const bps = getOrderFeeBps(order)

  if (Number(bps) === 0) {
    return null
  }

  return <OrderFeeConfirmationViewView bps={bps} brandName={BRAND_NAME} />
}
