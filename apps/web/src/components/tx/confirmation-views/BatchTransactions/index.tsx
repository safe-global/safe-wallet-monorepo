import { useLoadFeature } from '@/features/__core__'
import { BatchingFeature, useDraftBatch } from '@/features/batching'

function BatchTransactions() {
  const { BatchTxList } = useLoadFeature(BatchingFeature)
  const batchTxs = useDraftBatch()

  return <BatchTxList txItems={batchTxs} />
}

export default BatchTransactions
