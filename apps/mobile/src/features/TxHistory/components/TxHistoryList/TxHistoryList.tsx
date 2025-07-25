import React, { useMemo } from 'react'
import { Tabs } from 'react-native-collapsible-tab-view'
import { useTheme, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { TransactionItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getTxHash, GroupedTxsWithTitle, groupTxsByDate } from '@/src/features/TxHistory/utils'
import { HistoryTransactionItems } from '@safe-global/store/gateway/types'
import { renderItem } from '@/src/features/TxHistory/utils'
import { TransactionSkeleton, TransactionSkeletonItem } from '@/src/components/TransactionSkeleton'
import { DefaultSectionT, Platform, RefreshControl, SectionListProps } from 'react-native'
import { CircleSnail } from 'react-native-progress'

// Custom SectionList wrapper with optional custom refresh indicator
interface SectionListWithCustomRefreshProps<ItemT = any, SectionT = DefaultSectionT>
  extends SectionListProps<ItemT, SectionT> {
  refreshLoadingIndicator?: React.ReactNode
}

const SectionListWithCustomRefresh = (props: SectionListWithCustomRefreshProps) => {
  const { refreshLoadingIndicator, refreshControl, ...restProps } = props

  // Extract refresh props from refreshControl if it exists
  const refreshing = refreshControl?.props?.refreshing || false
  const onRefresh = refreshControl?.props?.onRefresh

  // Create hidden refresh control when custom indicator is provided
  const hiddenRefreshControl = useMemo(() => {
    if (!refreshLoadingIndicator) {
      return refreshControl
    }

    return (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor="transparent"
        colors={['transparent']}
        progressBackgroundColor="transparent"
        style={{ backgroundColor: 'transparent' }}
      />
    )
  }, [refreshLoadingIndicator, refreshControl, refreshing, onRefresh])

  return (
    <>
      {refreshing && refreshLoadingIndicator}
      <Tabs.SectionList {...restProps} refreshControl={hiddenRefreshControl} />
    </>
  )
}

interface TxHistoryList {
  transactions?: HistoryTransactionItems[]
  onEndReached: (info: { distanceFromEnd: number }) => void
  isLoading?: boolean
  refreshing?: boolean
  onRefresh?: () => void
}

export function TxHistoryList({ transactions, onEndReached, isLoading, refreshing, onRefresh }: TxHistoryList) {
  const theme = useTheme()

  const groupedList: GroupedTxsWithTitle<TransactionItem>[] = useMemo(() => {
    return groupTxsByDate(transactions || [])
  }, [transactions])

  const hasTransactions = transactions && transactions.length > 0
  const isInitialLoading = isLoading && !hasTransactions && !refreshing
  const isIOS = Platform.OS === 'ios'

  // ListEmptyComponent for initial loading state
  const renderEmptyComponent = useMemo(() => {
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
  }, [isInitialLoading])

  // ListFooterComponent for pagination loading (bottom loading)
  const renderFooterComponent = useMemo(() => {
    if (isLoading && hasTransactions) {
      return (
        <View testID="tx-history-pagination-loader" marginTop="$4">
          <TransactionSkeletonItem />
        </View>
      )
    }
    return null
  }, [isLoading, hasTransactions])

  const customRefreshIndicator = useMemo(() => {
    if (!isIOS) return undefined

    return (
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
    )
  }, [isIOS, theme])

  return (
    <View position="relative" flex={1}>
      <SectionListWithCustomRefresh
        testID="tx-history-list"
        stickySectionHeadersEnabled
        contentInsetAdjustmentBehavior="automatic"
        sections={groupedList}
        keyExtractor={(item, index) => (Array.isArray(item) ? getTxHash(item[0]) + index : getTxHash(item) + index)}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />}
        refreshLoadingIndicator={customRefreshIndicator}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooterComponent}
        renderSectionHeader={({ section: { title } }) => <SafeListItem.Header title={title} />}
      />
    </View>
  )
}
