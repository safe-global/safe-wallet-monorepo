import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import GnosisPayQueueItemSummary from './GnosisPayQueueItemSummary'
import { selectQueuedGnosisPayTransactions } from '@/store/gnosisPayTxsSlice'
import { useMemo } from 'react'
import { TxListGrid } from '@/components/transactions/TxList'
import { useIsGnosisPaySafe } from './hooks/useIsGnosisPaySafe'

export const GnosisPayQueue = () => {
  const [isGnosisPaySafe] = useIsGnosisPaySafe()

  const { safe } = useSafeInfo()

  const safeQueue = useAppSelector(selectQueuedGnosisPayTransactions(safe.address.value))

  const transactions = useMemo(() => {
    // queueNonce is unique per safe and the parent selector already scopes the
    // list to a single safe, so it's a stable, cheap React key on its own.
    return safeQueue.map((item) => {
      return <GnosisPayQueueItemSummary item={item} key={item.queueNonce} />
    })
  }, [safeQueue])

  if (!isGnosisPaySafe || safeQueue.length === 0) {
    return null
  }

  return <TxListGrid>{transactions}</TxListGrid>
}

export default GnosisPayQueue
