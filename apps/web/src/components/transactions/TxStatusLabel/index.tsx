import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { isCancelledSwapOrder } from '@/utils/transaction-guards'
import useIsPending from '@/hooks/useIsPending'
import useTransactionStatus from '@/hooks/useTransactionStatus'
import { TxStatusLabelView, type TxStatusTone } from '@views/components/transactions/TxStatusLabel/TxStatusLabelView'

const getStatusTone = (tx: Transaction): TxStatusTone => {
  if (isCancelledSwapOrder(tx.txInfo)) {
    return 'error'
  }

  switch (tx.txStatus) {
    case TransactionStatus.SUCCESS:
      return 'success'
    case TransactionStatus.FAILED:
    case TransactionStatus.CANCELLED:
      return 'error'
    case TransactionStatus.AWAITING_CONFIRMATIONS:
    case TransactionStatus.AWAITING_EXECUTION:
      return 'warning'
    default:
      return 'default'
  }
}

const TxStatusLabel = ({ tx }: { tx: Transaction }) => {
  const txStatusLabel = useTransactionStatus(tx)
  const isPending = useIsPending(tx.id)

  return <TxStatusLabelView tone={getStatusTone(tx)} label={txStatusLabel} isPending={isPending} />
}

export default TxStatusLabel
