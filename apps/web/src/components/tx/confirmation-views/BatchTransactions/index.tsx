import BatchTxList from '@/features/batching/public/BatchTxList'
import { useDraftBatch } from '@/features/batching/public/useDraftBatch'

function BatchTransactions() {
  const batchTxs = useDraftBatch()

  return <BatchTxList txItems={batchTxs} />
}

export default BatchTransactions
