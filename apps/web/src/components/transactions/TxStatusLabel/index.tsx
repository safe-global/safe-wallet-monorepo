import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { isCancelledSwapOrder } from '@/utils/transaction-guards'
import { CircularProgress, type Palette, Typography } from '@mui/material'
import useIsPending from '@/hooks/useIsPending'
import useTransactionStatus from '@/hooks/useTransactionStatus'

const getStatusColor = (tx: Transaction, palette: Palette) => {
  if (isCancelledSwapOrder(tx.txInfo)) {
    return palette.error.main
  }

  switch (tx.txStatus) {
    case TransactionStatus.SUCCESS:
      return palette.success.main
    case TransactionStatus.FAILED:
    case TransactionStatus.CANCELLED:
      return palette.error.main
    case TransactionStatus.AWAITING_CONFIRMATIONS:
    case TransactionStatus.AWAITING_EXECUTION:
      return palette.warning.main
    default:
      return palette.primary.main
  }
}

const TxStatusLabel = ({ tx }: { tx: Transaction }) => {
  const txStatusLabel = useTransactionStatus(tx)
  const isPending = useIsPending(tx.id)

  return (
    <Typography
      variant="caption"
      fontWeight="bold"
      display="flex"
      alignItems="center"
      gap={1}
      sx={{ color: ({ palette }) => getStatusColor(tx, palette) }}
      data-testid="tx-status-label"
    >
      {isPending && <CircularProgress size={14} color="inherit" />}
      {txStatusLabel}
    </Typography>
  )
}

export default TxStatusLabel
