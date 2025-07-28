import React, { useMemo, useCallback } from 'react'
import { View, Text, getTokenValue } from 'tamagui'
import { Tabs } from 'react-native-collapsible-tab-view'
import { getGroupHash, getTxHash } from '@/src/features/TxHistory/utils'
import { HistoryTransactionItems } from '@safe-global/store/gateway/types'
import { TxGroupedCard } from '@/src/components/transactions-list/Card/TxGroupedCard'
import { TxInfo } from '@/src/components/TxInfo'
import { TransactionSkeleton, TransactionSkeletonItem } from '@/src/components/TransactionSkeleton'
import { Platform, RefreshControl } from 'react-native'
import { formatWithSchema } from '@/src/utils/date'
import { isDateLabel } from '@/src/utils/transaction-guards'
import { groupBulkTxs } from '@/src/utils/transactions'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface TxHistoryList {
  transactions?: HistoryTransactionItems[]
  onEndReached: (info: { distanceFromEnd: number }) => void
  isLoading: boolean
  isLoadingNext: boolean
  refreshing: boolean
  onRefresh: () => void
}

const TAB_BAR_HEIGHT = 34

const renderItem = ({
  item,
  target,
}: {
  item: HistoryTransactionItems | HistoryTransactionItems[]
  target?: string
}) => {
  if (Array.isArray(item)) {
    // Render grouped transactions - filter to only TransactionItems for TxGroupedCard
    const transactionItems = item.filter((tx) => tx.type === 'TRANSACTION')
    if (transactionItems.length > 0) {
      return (
        <View marginTop="$4">
          <TxGroupedCard transactions={transactionItems} />
        </View>
      )
    }
    return null
  }

  if (isDateLabel(item)) {
    const dateTitle = formatWithSchema(item.timestamp, 'MMM d, yyyy')
    const isSticky = target === 'StickyHeader'

    return (
      <View
        marginTop={isSticky ? '$0' : '$2'}
        backgroundColor={'$background'}
        paddingTop={'$2'}
        paddingBottom={isSticky ? '$2' : '0'}
        paddingHorizontal={isSticky ? '$4' : '0'}
        transform={Platform.OS === 'ios' ? [{ translateY: isSticky ? TAB_BAR_HEIGHT : 0 }] : undefined}
      >
        <Text fontWeight={500} color="$colorSecondary">
          {dateTitle}
        </Text>
      </View>
    )
  }

  if (item.type === 'TRANSACTION') {
    return (
      <View marginTop="$4">
        <TxInfo tx={item.transaction} />
      </View>
    )
  }

  return null
}

const keyExtractor = (item: HistoryTransactionItems | HistoryTransactionItems[]) => {
  return Array.isArray(item) ? getGroupHash(item) : getTxHash(item)
}

const getItemType = (item: HistoryTransactionItems | HistoryTransactionItems[]) => {
  if (Array.isArray(item)) {
    return 'groupedTransaction'
  }
  if (isDateLabel(item)) {
    return 'dateHeader'
  }
  if (item.type === 'TRANSACTION') {
    return 'transaction'
  }
  return 'unknown'
}

const createEmptyComponent = (isInitialLoading: boolean) => {
  if (isInitialLoading) {
    return (
      <View
        flex={1}
        alignItems="flex-start"
        justifyContent="flex-start"
        paddingTop="$4"
        testID="tx-history-initial-loader"
      >
        <TransactionSkeleton count={6} sectionTitles={['Recent transactions']} />
      </View>
    )
  }
  return null
}

const createHeaderComponent = (isLoadingPrevious: boolean, hasTransactions: boolean) => {
  if (isLoadingPrevious && hasTransactions) {
    return (
      <View testID="tx-history-previous-loader" marginBottom="$4">
        <TransactionSkeletonItem />
      </View>
    )
  }
  return null
}

const createFooterComponent = (isLoadingNext: boolean, hasTransactions: boolean) => {
  if (isLoadingNext && hasTransactions) {
    return (
      <View testID="tx-history-next-loader" marginTop="$4">
        <TransactionSkeletonItem />
      </View>
    )
  }
  return null
}

const calculateStickyHeaderIndices = (flatList: (HistoryTransactionItems | HistoryTransactionItems[])[]) => {
  return flatList
    .map((item, index) => {
      if (!Array.isArray(item) && isDateLabel(item)) {
        return index
      }
      return null
    })
    .filter((item) => item !== null) as number[]
}

export function TxHistoryList({
  transactions,
  onEndReached,
  isLoading,
  isLoadingNext,
  refreshing,
  onRefresh,
}: TxHistoryList) {
  const { bottom } = useSafeAreaInsets()
  const flatList: (HistoryTransactionItems | HistoryTransactionItems[])[] = useMemo(() => {
    return groupBulkTxs(transactions || [])
  }, [transactions])

  const stickyHeaderIndices = useMemo(() => calculateStickyHeaderIndices(flatList), [flatList])

  const hasTransactions = !!(transactions && transactions.length > 0)
  const isInitialLoading = !!(isLoading && !hasTransactions && !refreshing)

  const renderEmptyComponent = useMemo(() => createEmptyComponent(isInitialLoading), [isInitialLoading])

  const renderHeaderComponent = useMemo(
    () => createHeaderComponent(isLoading, hasTransactions),
    [isLoading, hasTransactions],
  )

  const renderFooterComponent = useMemo(
    () => createFooterComponent(isLoadingNext, hasTransactions),
    [isLoadingNext, hasTransactions],
  )

  const handleEndReached = useCallback(() => {
    onEndReached({ distanceFromEnd: 0 })
  }, [onEndReached])

  return (
    <View position="relative" flex={1}>
      {Platform.OS === 'android' && <View style={{ height: TAB_BAR_HEIGHT }}></View>}
      <Tabs.FlashList
        testID="tx-history-list"
        data={flatList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        stickyHeaderIndices={stickyHeaderIndices}
        estimatedItemSize={100}
        estimatedFirstItemOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT : 0}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: bottom + getTokenValue('$4'),
        }}
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={renderHeaderComponent}
        ListFooterComponent={renderFooterComponent}
        contentInsetAdjustmentBehavior="automatic"
      />
    </View>
  )
}
