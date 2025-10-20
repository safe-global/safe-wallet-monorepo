import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Box } from '@mui/material'
import { isAwaitingExecution } from '@/utils/transaction-guards'
import ExecuteTxButton from '../ExecuteTxButton'
import SignTxButton from '../SignTxButton'
import { useAppSelector } from '@/store'
import { PendingStatus, selectPendingTxById } from '@/store/pendingTxsSlice'
import { SpeedUpMonitor } from '@/features/speedup/components/SpeedUpMonitor'

const QueueActions = ({ tx }: { tx: Transaction }) => {
  const awaitingExecution = isAwaitingExecution(tx.txStatus)
  const pendingTx = useAppSelector((state) => selectPendingTxById(state, tx.id))

  let ExecutionComponent = null
  if (!pendingTx) {
    ExecutionComponent = <SignTxButton txSummary={tx} compact />
    if (awaitingExecution) {
      ExecutionComponent = <ExecuteTxButton txSummary={tx} compact />
    }
  }

  return (
    <Box data-testid="tx-actions" mr={2} display="flex" justifyContent="center">
      {ExecutionComponent}
      {pendingTx && pendingTx.status === PendingStatus.PROCESSING && (
        <SpeedUpMonitor txId={tx.id} pendingTx={pendingTx} modalTrigger="alertButton" />
      )}
    </Box>
  )
}

export default QueueActions
