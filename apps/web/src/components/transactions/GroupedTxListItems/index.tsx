import type { AnyTransactionItem } from '@/utils/tx-list'
import type { ReactElement } from 'react'
import { useContext } from 'react'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import ExpandableTransactionItem from '@/components/transactions/TxListItem/ExpandableTransactionItem'
import { ReplaceTxHoverContext, ReplaceTxHoverProvider } from './ReplaceTxHoverProvider'
import { GroupedTxListItemsView } from '@views/components/transactions/GroupedTxListItems/GroupedTxListItemsView'

const TxGroup = ({ groupedListItems }: { groupedListItems: AnyTransactionItem[] }): ReactElement => {
  const nonce = isMultisigExecutionInfo(groupedListItems[0].transaction.executionInfo)
    ? groupedListItems[0].transaction.executionInfo.nonce
    : undefined

  const { replacedTxIds } = useContext(ReplaceTxHoverContext)

  return (
    <GroupedTxListItemsView
      nonce={nonce}
      items={groupedListItems.map((tx) => ({
        id: tx.transaction.id,
        item: <ExpandableTransactionItem item={tx} isConflictGroup />,
      }))}
      replacedTxIds={replacedTxIds}
    />
  )
}

const GroupedTxListItems = ({ groupedListItems }: { groupedListItems: AnyTransactionItem[] }): ReactElement | null => {
  if (groupedListItems.length === 0) return null

  return (
    <ReplaceTxHoverProvider groupedListItems={groupedListItems}>
      <TxGroup groupedListItems={groupedListItems} />
    </ReplaceTxHoverProvider>
  )
}

export default GroupedTxListItems
