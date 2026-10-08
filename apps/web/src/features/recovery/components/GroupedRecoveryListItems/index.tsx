import partition from 'lodash/partition'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import type { ReactElement } from 'react'
import type { AnyTransactionItem } from '@/utils/tx-list'

import { isRecoveryQueueItem } from '@/utils/transaction-guards'
import ExpandableTransactionItem from '@/components/transactions/TxListItem/ExpandableTransactionItem'
import RecoveryListItem from '../RecoveryListItem'
import { GroupedRecoveryListItemsView } from '@views/features/recovery/components/GroupedRecoveryListItems/GroupedRecoveryListItemsView'

export default function GroupedRecoveryListItems({
  items,
}: {
  items: Array<AnyTransactionItem | RecoveryQueueItem>
}): ReactElement {
  const [recoveries, cancellations] = partition(items, isRecoveryQueueItem) as [
    RecoveryQueueItem[],
    AnyTransactionItem[],
  ]

  // Should only be one recovery item but check array in case
  const isMalicious = recoveries.some((recovery) => recovery.isMalicious)

  return (
    <GroupedRecoveryListItemsView
      isMalicious={isMalicious}
      cancellations={cancellations.map((tx) => ({
        key: tx.transaction.id,
        content: <ExpandableTransactionItem item={tx} />,
      }))}
      recoveries={recoveries.map((recovery) => (
        <RecoveryListItem key={recovery.transactionHash} item={recovery} />
      ))}
    />
  )
}
