import React, { useMemo } from 'react'
import { SectionList } from 'react-native'

import { SafeListItem } from '@/src/components/SafeListItem'
import { TransactionItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getTxHash, GroupedTxsWithTitle, groupTxsByDate } from '@/src/features/TxHistory/utils'
import { HistoryTransactionItems } from '@safe-global/store/gateway/types'
import { renderItem } from '@/src/features/TxHistory/utils'
import { Loader } from '@/src/components/Loader'

interface TxHistoryList {
  transactions?: HistoryTransactionItems[]
  onEndReached: (info: { distanceFromEnd: number }) => void
  isLoading?: boolean
}

export function TxHistoryList({ transactions, onEndReached, isLoading }: TxHistoryList) {
  const groupedList: GroupedTxsWithTitle<TransactionItem>[] = useMemo(() => {
    return groupTxsByDate(transactions || [])
  }, [transactions])

  return (
    <SectionList
      testID="tx-history-list"
      stickySectionHeadersEnabled
      contentInsetAdjustmentBehavior="automatic"
      sections={groupedList}
      keyExtractor={(item, index) => (Array.isArray(item) ? getTxHash(item[0]) + index : getTxHash(item) + index)}
      renderItem={renderItem}
      onEndReached={onEndReached}
      contentContainerStyle={{ paddingHorizontal: 16 }}
      ListFooterComponent={isLoading ? <Loader size={24} color="$color" /> : undefined}
      renderSectionHeader={({ section: { title } }) => <SafeListItem.Header title={title} />}
    />
  )
}
