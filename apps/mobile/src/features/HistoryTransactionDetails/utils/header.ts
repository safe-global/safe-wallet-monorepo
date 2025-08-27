import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isTransferTxInfo } from '@/src/utils/transaction-guards'

export const getHeaderTitle = (txDetails: TransactionDetails) => {
  if (isTransferTxInfo(txDetails.txInfo)) {
    const isOutgoing = txDetails.txInfo.direction === 'OUTGOING'
    return isOutgoing ? 'Sent' : 'Received'
  }
  return 'Transaction details'
}
