import React, { useMemo, useCallback } from 'react'
import { View, getTokenValue } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import { RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { HistoryTransactionItems } from '@safe-global/store/gateway/types'
import { isDateLabel, isCreationTxInfo } from '@/src/utils/transaction-guards'
import { groupBulkTxs } from '@/src/utils/transactions'
import { TxCardPress } from '@/src/components/TxInfo/types'
import { GroupedTransactionItem } from './components/GroupedTransactionItem'
import { DateHeaderItem } from './components/DateHeaderItem'
import { TransactionListItem } from './components/TransactionListItem'
import { EmptyComponent, FooterComponent } from './components/LoadingComponents'
import { ErrorComponent } from './components/ErrorComponent'
import { keyExtractor, getItemType } from './utils'
import { EMPTY_ARRAY } from './constants'

interface TxHistoryList {
  transactions?: HistoryTransactionItems[]
  onEndReached: (info: { distanceFromEnd: number }) => void
  isLoading: boolean
  isLoadingNext: boolean
  isError: boolean
  refreshing: boolean
  onRefresh: () => void
}

export function TxHistoryList({
  transactions,
  onEndReached,
  isLoading,
  isLoadingNext,
  isError,
  refreshing,
  onRefresh,
}: TxHistoryList) {
  const { bottom } = useSafeAreaInsets()
  const router = useRouter()

  const onHistoryTransactionPress = useCallback(
    (transaction: TxCardPress) => {
      // TODO: Remove this once the endpoint is fixed (see issue https://linear.app/safe-global/issue/COR-547/cgw-cant-return-information-for-creation-txs)
      if (isCreationTxInfo(transaction.tx.txInfo)) {
        console.log('Creation transaction navigation disabled:', transaction.tx.id)
        return
      }

      router.push({
        pathname: '/history-transaction-details',
        params: {
          txId: transaction.tx.id,
        },
      })
    },
    [router],
  )

  const groupedTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return EMPTY_ARRAY
    }
    return groupBulkTxs(transactions)
  }, [transactions])

  const renderItem = useCallback(
    ({ item }: { item: HistoryTransactionItems | HistoryTransactionItems[] }) => {
      if (Array.isArray(item)) {
        return <GroupedTransactionItem item={item} onPress={onHistoryTransactionPress} />
      }

      if (isDateLabel(item)) {
        return <DateHeaderItem timestamp={item.timestamp} />
      }

      if (item.type === 'TRANSACTION') {
        return <TransactionListItem item={item} onPress={onHistoryTransactionPress} />
      }

      return null
    },
    [onHistoryTransactionPress],
  )

  const hasTransactions = !!(transactions && transactions.length > 0)
  const isInitialLoading = !!(isLoading && !hasTransactions && !refreshing)

  const handleEndReached = useCallback(() => {
    onEndReached({ distanceFromEnd: 0 })
  }, [onEndReached])

  const contentContainerStyle = useMemo(
    () => ({
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: bottom + getTokenValue('$4'),
    }),
    [bottom],
  )

  const listEmptyComponent = useMemo(() => {
    // Prioritize error state over loading state
    if (isError && !hasTransactions && !refreshing) {
      return <ErrorComponent />
    }
    if (isInitialLoading) {
      return <EmptyComponent />
    }
    return null
  }, [isError, hasTransactions, refreshing, isInitialLoading])

  return (
    <View position="relative" flex={1}>
      <FlashList
        testID="tx-history-list"
        data={groupedTransactions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={contentContainerStyle}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={isLoadingNext && hasTransactions ? <FooterComponent /> : null}
        contentInsetAdjustmentBehavior="automatic"
      />
    </View>
  )
}
