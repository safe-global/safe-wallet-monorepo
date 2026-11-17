import GnosisPayQueueItemSummary from './GnosisPayQueueItemSummary'
import { TxListGrid } from '@/components/transactions/TxList'
import { useGnosisPayQueue } from './hooks/useGnosisPayQueue'

export const GnosisPayQueue = () => {
  const [queue] = useGnosisPayQueue()

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
