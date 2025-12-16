import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import SwapOrderConfirmation from '@/features/swap/components/SwapOrderConfirmationView'
import type { NarrowConfirmationViewProps } from '../types'

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
