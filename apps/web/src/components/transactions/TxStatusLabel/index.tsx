import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { isCancelledSwapOrder } from '@/utils/transaction-guards'
import { Spinner } from '@/components/ui/spinner'
import useIsPending from '@/hooks/useIsPending'
import useTransactionStatus from '@/hooks/useTransactionStatus'

const getStatusColor = (tx: Transaction): string => {
  if (isCancelledSwapOrder(tx.txInfo)) {
    return 'var(--color-error-main)'
  }

  switch (tx.txStatus) {
    case TransactionStatus.SUCCESS:
      return 'var(--color-success-main)'
    case TransactionStatus.FAILED:
    case TransactionStatus.CANCELLED:
      return 'var(--color-error-main)'
    case TransactionStatus.AWAITING_CONFIRMATIONS:
    case TransactionStatus.AWAITING_EXECUTION:
      return 'var(--color-warning-main)'
    default:
      return 'var(--color-primary-main)'
  }
}

const TxStatusLabel = ({ tx }: { tx: Transaction }) => {
  const txStatusLabel = useTransactionStatus(tx)
  const isPending = useIsPending(tx.id)

  return (
    <span
      className="flex items-center gap-2 text-xs font-bold"
      style={{ color: getStatusColor(tx) }}
      data-testid="tx-status-label"
    >
      {isPending && <Spinner className="size-3.5" />}
      {txStatusLabel}
    </span>
  )
}

export default TxStatusLabel
