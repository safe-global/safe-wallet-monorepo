import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import type { NarrowConfirmationViewProps } from '../types'
import SwapOrderConfirmation from '@/features/swap/public/SwapOrderConfirmation'

interface SwapOrderProps extends NarrowConfirmationViewProps {
  txInfo: OrderTransactionInfo
}

function SwapOrder({ txInfo, txData }: SwapOrderProps) {
  return (
    <SwapOrderConfirmation
      order={txInfo}
      decodedData={txData?.dataDecoded}
      settlementContract={txData?.to?.value ?? ''}
    />
  )
}

export default SwapOrder
