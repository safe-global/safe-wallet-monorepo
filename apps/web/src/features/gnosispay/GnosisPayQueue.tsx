import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import GnosisPayQueueItemSummary from './GnosisPayQueueItemSummary'
import { selectQueuedGnosisPayTransactions } from '@/store/gnosisPayTxsSlice'
import { useMemo } from 'react'
import { TxListGrid } from '@/components/transactions/TxList'

const GNOSIS_CHAIN_ID = '100'

export const GnosisPayQueue = () => {
  const chain = useCurrentChain()

  const { safe } = useSafeInfo()

  const safeQueue = useAppSelector(selectQueuedGnosisPayTransactions(safe.address.value))

  const transactions = useMemo(() => {
    return safeQueue.map((item) => {
      return <GnosisPayQueueItemSummary item={item} key={item.queueNonce + JSON.stringify(item.safeTxData)} />
    })
  }, [safeQueue])

  if (chain?.chainId !== GNOSIS_CHAIN_ID || safeQueue.length === 0) {
    return null
  }

  return <TxListGrid>{transactions}</TxListGrid>
}
