import { Alert, AlertDescription } from '@safe-global/views/components/ui/alert'
import GnosisPayQueueItemSummary from './GnosisPayQueueItemSummary'
import { TxListGrid } from '@/components/transactions/TxList'
import { useGnosisPayQueue } from './hooks/useGnosisPayQueue'

export const GnosisPayQueue = () => {
  const [queue, error, loading] = useGnosisPayQueue()

  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>Could not load the Gnosis Pay queue. Please try again.</AlertDescription>
      </Alert>
    )
  if (loading && !queue) return <p role="status">Loading Gnosis Pay queue…</p>

  if (!queue?.length) {
    return null
  }

  return (
    <TxListGrid>
      {queue.map((item) => (
        <GnosisPayQueueItemSummary item={item} key={item.queueNonce} />
      ))}
    </TxListGrid>
  )
}

export default GnosisPayQueue
