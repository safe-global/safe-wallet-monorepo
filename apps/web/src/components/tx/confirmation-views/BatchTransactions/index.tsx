import { BatchTxList } from '@/features/batching'
import { useDraftBatch } from '@/features/batching/hooks/useDraftBatch'

function BatchTransactions() {
  const batchTxs = useDraftBatch()

  return <BatchTxList txItems={batchTxs} />
}

export default BatchTransactions
