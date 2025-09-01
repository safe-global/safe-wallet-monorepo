import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  isSwapOrderTxInfo,
  isTransferTxInfo,
  isTwapOrderTxInfo,
  isAddSignerTxInfo,
} from '@/src/utils/transaction-guards'

export const getHeaderTitle = (txDetails: TransactionDetails) => {
  if (isTransferTxInfo(txDetails.txInfo)) {
    const isOutgoing = txDetails.txInfo.direction === 'OUTGOING'
    return isOutgoing ? 'Sent' : 'Received'
  }
  if (isSwapOrderTxInfo(txDetails.txInfo)) {
    return 'Swap order'
  }
  if (isTwapOrderTxInfo(txDetails.txInfo)) {
    return 'Twap order'
  }
  if (isAddSignerTxInfo(txDetails.txInfo)) {
    return 'Add signer'
  }

  return 'Transaction details'
}
