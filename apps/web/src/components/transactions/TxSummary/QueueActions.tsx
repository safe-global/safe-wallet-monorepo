import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isAwaitingExecution } from '@/utils/transaction-guards'
import ExecuteTxButton from '../ExecuteTxButton'
import SignTxButton from '../SignTxButton'
import { useAppSelector } from '@/store'
import { PendingStatus, selectPendingTxById } from '@/store/pendingTxsSlice'
import { useLoadFeature } from '@/features/__core__'
import { SpeedupFeature } from '@/features/speedup'
import { QueueActionsView } from '@views/components/transactions/TxSummary/QueueActionsView'

const QueueActions = ({ tx }: { tx: Transaction }) => {
  const awaitingExecution = isAwaitingExecution(tx.txStatus)
  const pendingTx = useAppSelector((state) => selectPendingTxById(state, tx.id))
  const { SpeedUpMonitor } = useLoadFeature(SpeedupFeature)

  let ExecutionComponent = null
  if (!pendingTx) {
    ExecutionComponent = <SignTxButton txSummary={tx} compact />
    if (awaitingExecution) {
      ExecutionComponent = <ExecuteTxButton txSummary={tx} compact />
    }
  }

  const showSpeedUp = pendingTx?.status === PendingStatus.PROCESSING

  if (!ExecutionComponent && !showSpeedUp) return null

  return (
    <QueueActionsView
      execution={ExecutionComponent}
      renderSpeedUp={
        pendingTx?.status === PendingStatus.PROCESSING
          ? (modalTrigger) => <SpeedUpMonitor txId={tx.id} pendingTx={pendingTx} modalTrigger={modalTrigger} />
          : undefined
      }
    />
  )
}

export default QueueActions
