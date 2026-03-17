import BatchTxList from '@/features/batching/components/BatchSidebar/BatchTxList'
import { useDraftBatch } from '@/features/batching'

function BatchTransactions() {
  const batchTxs = useDraftBatch()

  return <BatchTxList txItems={batchTxs} />
}

export default BatchTransactions
