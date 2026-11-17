import BatchTxList from '@/features/batching/public/components/BatchTxList'
import { useDraftBatch } from '@/features/batching/public/hooks/useDraftBatch'

function BatchTransactions() {
  const batchTxs = useDraftBatch()

  return <BatchTxList txItems={batchTxs} />
}

export default BatchTransactions
