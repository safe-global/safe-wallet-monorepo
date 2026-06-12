import { BatchTxList, useDraftBatch } from '@/features/batching'

function BatchTransactions() {
  const batchTxs = useDraftBatch()

  return <BatchTxList txItems={batchTxs} />
}

export default BatchTransactions
