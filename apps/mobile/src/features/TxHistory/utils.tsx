import { DateLabel, TransactionItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { groupBulkTxs } from '@/src/utils/transactions'
import { formatWithSchema } from '@/src/utils/date'
import { isDateLabel } from '@/src/utils/transaction-guards'
import { HistoryTransactionItems } from '@safe-global/store/gateway/types'
import { View } from 'tamagui'
import { TxGroupedCard } from '@/src/components/transactions-list/Card/TxGroupedCard'
import { TxInfo } from '@/src/components/TxInfo'
import React from 'react'

export type GroupedTxs<T> = (T | T[])[]

export interface GroupedTxsWithTitle<T> {
  title: string
  data: (T | T[])[]
}

export const groupTxsByDate = (list: HistoryTransactionItems[]) => {
  return groupByDateLabel(groupBulkTxs(list))
}

const getDateLabel = (item: HistoryTransactionItems) => {
  if (isDateLabel(item)) {
    return formatWithSchema(item.timestamp, 'MMM d, yyyy')
  }
  return undefined
}

const groupByDateLabel = (
  list: GroupedTxs<HistoryTransactionItems>,
): GroupedTxsWithTitle<Exclude<HistoryTransactionItems, DateLabel>>[] => {
  const groupedTx: GroupedTxsWithTitle<Exclude<HistoryTransactionItems, DateLabel>>[] = []

  list.forEach((item) => {
    if (Array.isArray(item) || item.type === 'TRANSACTION') {
      if (groupedTx.length === 0) {
        groupedTx.push({ title: 'Unknown Date', data: [] })
      }
      groupedTx[groupedTx.length - 1].data.push(item as Exclude<HistoryTransactionItems, DateLabel>)
    } else {
      const title = getDateLabel(item)
      if (title) {
        groupedTx.push({ title, data: [] })
      }
    }
  })

  return groupedTx
}
export const getTxHash = (item: HistoryTransactionItems): string => {
  if (item.type !== 'TRANSACTION') {
    return ''
  }

  return item.transaction.txHash as unknown as string
}
export const renderItem = ({ item, index }: { item: TransactionItem | TransactionItem[]; index: number }) => {
  return (
    <View marginTop={index && '$4'}>
      {Array.isArray(item) ? <TxGroupedCard transactions={item} /> : <TxInfo tx={item.transaction} />}
    </View>
  )
}
