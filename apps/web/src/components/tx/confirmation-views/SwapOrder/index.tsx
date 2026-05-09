import type { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { SwapFeature } from '@/features/swap'
import { useLoadFeature } from '@/features/__core__'
import type { NarrowConfirmationViewProps } from '../types'

interface SwapOrderProps extends NarrowConfirmationViewProps {
  txInfo: OrderTransactionInfo
}

function SwapOrder({ txInfo, txData }: SwapOrderProps) {
  const { SwapOrderConfirmation } = useLoadFeature(SwapFeature)

  return (
    <SwapOrderConfirmation
      order={txInfo}
      decodedData={txData?.dataDecoded}
      settlementContract={txData?.to?.value ?? ''}
    />
  )
}

export default SwapOrder
