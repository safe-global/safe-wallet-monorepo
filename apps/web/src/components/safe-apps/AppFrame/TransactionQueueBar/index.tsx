import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Dispatch, ReactElement, SetStateAction } from 'react'
import useTxQueue from '@/hooks/useTxQueue'
import PaginatedTxns from '@/components/common/PaginatedTxns'
import { getQueuedTransactionCount } from '@/utils/transactions'
import BatchExecuteButton from '@/components/transactions/BatchExecuteButton'
import {
  TRANSACTION_BAR_HEIGHT,
  TransactionQueueBarView,
} from '@views/components/safe-apps/AppFrame/TransactionQueueBar/TransactionQueueBarView'

type Props = {
  expanded: boolean
  visible: boolean
  setExpanded: Dispatch<SetStateAction<boolean>>
  onDismiss: () => void
  transactions: QueuedItemPage
}

const TransactionQueueBar = ({
  expanded,
  visible,
  setExpanded,
  onDismiss,
  transactions,
}: Props): ReactElement | null => {
  if (!visible || transactions.results.length === 0) {
    return null
  }

  const queuedTxCount = getQueuedTransactionCount(transactions)

  return (
    <TransactionQueueBarView
      expanded={expanded}
      onExpandedChange={setExpanded}
      onDismiss={onDismiss}
      queuedTxCount={queuedTxCount}
      batchExecuteButton={<BatchExecuteButton />}
      txList={<PaginatedTxns useTxns={useTxQueue} />}
    />
  )
}

export { TRANSACTION_BAR_HEIGHT }

export default TransactionQueueBar
