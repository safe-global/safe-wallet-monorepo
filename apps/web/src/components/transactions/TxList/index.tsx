import GroupedTxListItems from '@/components/transactions/GroupedTxListItems'
import { groupTxs, type AnyTransactionItem } from '@/utils/tx-list'
import { Box } from '@mui/material'
import type { ReactElement, ReactNode } from 'react'
import { useMemo } from 'react'
import TxListItem from '../TxListItem'
import css from './styles.module.css'
import uniq from 'lodash/uniq'
import BulkTxListGroup from '@/components/transactions/BulkTxListGroup'
import type { AnyResults } from '@/utils/transaction-guards'

type TxListProps = {
  items: AnyResults[]
}

const getBulkGroupTxHash = (group: AnyTransactionItem[]) => {
  const hashList = group.map((item) => item.transaction.txHash)
  return uniq(hashList).length === 1 ? hashList[0] : undefined
}

export const TxListGrid = ({ children }: { children: ReactNode }): ReactElement => {
  return <Box className={css.container}>{children}</Box>
}

const TxList = ({ items }: TxListProps): ReactElement => {
  const groupedTransactions = useMemo(() => groupTxs(items), [items])

  const transactions = groupedTransactions.map((item, index) => {
    if (!Array.isArray(item)) {
      return <TxListItem key={index} item={item} />
    }

    const bulkTransactionHash = getBulkGroupTxHash(item)
    if (bulkTransactionHash) {
      return <BulkTxListGroup key={index} groupedListItems={item} transactionHash={bulkTransactionHash} />
    }

    return <GroupedTxListItems key={index} groupedListItems={item} />
  })

  return <TxListGrid>{transactions}</TxListGrid>
}

export default TxList
