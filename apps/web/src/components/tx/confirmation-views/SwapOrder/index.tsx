import SwapOrderConfirmation from '@/features/swap/components/SwapOrderConfirmationView'
import type { Order } from '@safe-global/safe-gateway-typescript-sdk'
import type { NarrowConfirmationViewProps } from '../types'

interface SwapOrderProps extends NarrowConfirmationViewProps {
  txInfo: Order
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
