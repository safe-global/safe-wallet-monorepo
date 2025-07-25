import React, { useMemo, useCallback } from 'react'
import { useTheme, View, Text } from 'tamagui'
import { Tabs } from 'react-native-collapsible-tab-view'
import { getTxHash } from '@/src/features/TxHistory/utils'
import { HistoryTransactionItems } from '@safe-global/store/gateway/types'
import { TxGroupedCard } from '@/src/components/transactions-list/Card/TxGroupedCard'
import { TxInfo } from '@/src/components/TxInfo'
import { TransactionSkeleton, TransactionSkeletonItem } from '@/src/components/TransactionSkeleton'
import { RefreshControl } from 'react-native'
import { CircleSnail } from 'react-native-progress'
import QuickCrypto from 'react-native-quick-crypto'
import { formatWithSchema } from '@/src/utils/date'
import { isDateLabel } from '@/src/utils/transaction-guards'
import { TransactionItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { groupBulkTxs } from '@/src/utils/transactions'

interface TxHistoryList {
  transactions?: HistoryTransactionItems[]
  onEndReached: (info: { distanceFromEnd: number }) => void
  isLoading?: boolean
  isLoadingNext?: boolean
  isLoadingPrevious?: boolean
  refreshing?: boolean
  onRefresh?: () => void
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
    const transactionItems = item.filter((tx): tx is TransactionItem => tx.type === 'TRANSACTION')
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
        paddingTop={isSticky ? '$2' : '$2'}
        paddingBottom={isSticky ? '$2' : '0'}
        paddingHorizontal={isSticky ? '$4' : '0'}
        transform={[{ translateY: isSticky ? TAB_BAR_HEIGHT : 0 }]}
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

  // Fallback for other item types
  return (
    <View backgroundColor="lightgray" height={80} marginBottom={16} marginHorizontal={16}>
      <Text>Unknown item type</Text>
    </View>
  )
}

const keyExtractor = (item: HistoryTransactionItems | HistoryTransactionItems[]) => {
  if (Array.isArray(item)) {
    const key = QuickCrypto.createHash('sha256')
      .update(item.map((tx) => getTxHash(tx)).join('_'))
      .digest('hex')
    return key
  }

  return getTxHash(item)
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
  isLoadingPrevious,
  refreshing,
  onRefresh,
}: TxHistoryList) {
  const theme = useTheme()

  const flatList: (HistoryTransactionItems | HistoryTransactionItems[])[] = useMemo(() => {
    return groupBulkTxs(transactions || [])
  }, [transactions])

  const stickyHeaderIndices = useMemo(() => calculateStickyHeaderIndices(flatList), [flatList])

  const hasTransactions = !!(transactions && transactions.length > 0)
  const isInitialLoading = !!(isLoading && !hasTransactions && !refreshing)

  const renderEmptyComponent = useMemo(() => createEmptyComponent(isInitialLoading), [isInitialLoading])

  const renderHeaderComponent = useMemo(
    () => createHeaderComponent(!!isLoadingPrevious, hasTransactions),
    [isLoadingPrevious, hasTransactions],
  )

  const renderFooterComponent = useMemo(
    () => createFooterComponent(!!isLoadingNext, hasTransactions),
    [isLoadingNext, hasTransactions],
  )

  const handleEndReached = useCallback(() => {
    onEndReached({ distanceFromEnd: 0 })
  }, [onEndReached])

  return (
    <View position="relative" flex={1}>
      {!!refreshing && (
        <View
          position="absolute"
          top={64}
          alignSelf="center"
          zIndex={1000}
          backgroundColor="$background"
          borderRadius={20}
          padding="$2"
          testID="tx-history-progress-indicator"
        >
          <CircleSnail size={24} color={theme.color.get()} thickness={2} duration={600} spinDuration={1500} />
        </View>
      )}

      <Tabs.FlashList
        testID="tx-history-list"
        data={flatList}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        stickyHeaderIndices={stickyHeaderIndices}
        estimatedItemSize={100}
        estimatedFirstItemOffset={TAB_BAR_HEIGHT}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor="transparent" // Hide default spinner
            colors={['transparent']} // Hide default spinner on Android
            progressBackgroundColor="transparent"
            style={{ backgroundColor: 'transparent' }}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={renderHeaderComponent}
        ListFooterComponent={renderFooterComponent}
        contentInsetAdjustmentBehavior="automatic"
      />
    </View>
  )
}
