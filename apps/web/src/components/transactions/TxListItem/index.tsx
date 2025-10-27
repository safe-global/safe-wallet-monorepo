import { type ReactElement } from 'react'
import { isDateLabel, isLabelListItem, isTransactionListItem } from '@/utils/transaction-guards'
import GroupLabel from '@/components/transactions/GroupLabel'
import TxDateLabel from '@/components/transactions/TxDateLabel'
import ExpandableTransactionItem from './ExpandableTransactionItem'
import type { PendingTransactionItems } from '@safe-global/store/gateway/types'
import type { AnyListItem } from '@/utils/tx-list'

type TxListItemProps = {
  item: AnyListItem | PendingTransactionItems
}

const TxListItem = ({ item }: TxListItemProps): ReactElement | null => {
  if (isLabelListItem(item)) {
    return <GroupLabel item={item} />
  }
  if (isTransactionListItem(item)) {
    return <ExpandableTransactionItem item={item} />
  }
  if (isDateLabel(item)) {
    return <TxDateLabel item={item} />
  }
  return null
}

export default TxListItem
