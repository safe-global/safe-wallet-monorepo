import { useMemo } from 'react'
import type { ReactElement } from 'react'

import { TxListGrid } from '@/components/transactions/TxList'
import RecoveryListItem from '../RecoveryListItem'
import { useRecoveryQueue } from '../../hooks/useRecoveryQueue'
import { groupRecoveryTransactions } from '@/utils/tx-list'
import useTxQueue from '@/hooks/useTxQueue'
import GroupedRecoveryListItems from '../GroupedRecoveryListItems'
import { isRecoveryQueueItem } from '@/utils/transaction-guards'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import { useIsRecoverySupported } from '../../hooks/useIsRecoverySupported'
import { RecoveryListView } from '@views/features/recovery/components/RecoveryList/RecoveryListView'

function InternalRecoveryList({ recoveryQueue }: { recoveryQueue: Array<RecoveryQueueItem> }): ReactElement {
  const queue = useTxQueue()

  const groupedItems = useMemo(() => {
    if (!queue?.page?.results || queue.page.results.length === 0) {
      return recoveryQueue
    }
    return groupRecoveryTransactions(queue.page.results, recoveryQueue)
  }, [queue, recoveryQueue])

  const transactions = useMemo(() => {
    return groupedItems.map((item, index) => {
      if (Array.isArray(item)) {
        return <GroupedRecoveryListItems items={item} key={index} />
      }

      if (isRecoveryQueueItem(item)) {
        return <RecoveryListItem item={item} key={item.transactionHash} />
      }

      return null
    })
  }, [groupedItems])

  return <TxListGrid>{transactions}</TxListGrid>
}

function RecoveryList(): ReactElement | null {
  const supportsRecovery = useIsRecoverySupported()
  const recoveryQueue = useRecoveryQueue()

  if (!supportsRecovery || recoveryQueue.length === 0) {
    return null
  }

  return <RecoveryListView list={<InternalRecoveryList recoveryQueue={recoveryQueue} />} />
}

export default RecoveryList
