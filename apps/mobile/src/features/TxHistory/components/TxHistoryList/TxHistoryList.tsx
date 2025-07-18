import React, { useMemo } from 'react'
import { Tabs } from 'react-native-collapsible-tab-view'
import { View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { TransactionItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getTxHash, GroupedTxsWithTitle, groupTxsByDate } from '@/src/features/TxHistory/utils'
import { HistoryTransactionItems } from '@safe-global/store/gateway/types'
import { renderItem } from '@/src/features/TxHistory/utils'
import { TxHistorySkeleton, TxHistorySkeletonItem } from '../TxHistorySkeleton'

interface TxHistoryList {
  transactions?: HistoryTransactionItems[]
  onEndReached: (info: { distanceFromEnd: number }) => void
  isLoading?: boolean
  refreshing?: boolean
  onRefresh?: () => void
}

export function TxHistoryList({ transactions, onEndReached, isLoading, refreshing, onRefresh }: TxHistoryList) {
  const groupedList: GroupedTxsWithTitle<TransactionItem>[] = useMemo(() => {
    return groupTxsByDate(transactions || [])
  }, [transactions])

  const hasTransactions = transactions && transactions.length > 0
  const isInitialLoading = isLoading && !hasTransactions && !refreshing

  // ListEmptyComponent for initial loading state
  const renderEmptyComponent = () => {
    if (isInitialLoading) {
      return (
        <View
          flex={1}
          alignItems="flex-start"
          justifyContent="flex-start"
          paddingTop="$4"
          testID="tx-history-initial-loader"
        >
          <TxHistorySkeleton />
        </View>
      )
    }
    return null
  }

  // ListFooterComponent for pagination loading (bottom loading)
  const renderFooterComponent = () => {
    if (isLoading && hasTransactions) {
      return (
        <View testID="tx-history-pagination-loader" marginTop="$4">
          <TxHistorySkeletonItem />
        </View>
      )
    }
    return null
  }

  return (
    <Tabs.SectionList
      testID="tx-history-list"
      stickySectionHeadersEnabled
      contentInsetAdjustmentBehavior="automatic"
      sections={groupedList}
      keyExtractor={(item, index) => (Array.isArray(item) ? getTxHash(item[0]) + index : getTxHash(item) + index)}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      refreshing={refreshing}
      onRefresh={onRefresh}
      style={{ marginTop: -16 }} // Compensate for SafeTab container marginTop
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 8,
        marginTop: 16,
      }}
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderFooterComponent}
      renderSectionHeader={({ section: { title } }) => <SafeListItem.Header title={title} />}
    />
  )
}
