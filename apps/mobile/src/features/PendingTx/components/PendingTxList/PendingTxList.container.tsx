import { SafeListItem } from '@/src/components/SafeListItem'
import React from 'react'
import { SectionList } from 'react-native'
import { Spinner, View } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { NavBarTitle } from '@/src/components/Title/NavBarTitle'
import { LargeHeaderTitle } from '@/src/components/Title/LargeHeaderTitle'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { PendingTransactionItems } from '@safe-global/store/gateway/types'
import { keyExtractor, renderItem } from '@/src/features/PendingTx/utils'

export interface GroupedPendingTxsWithTitle {
  title: string
  data: (PendingTransactionItems | TransactionQueuedItem[])[]
}

interface PendingTxListContainerProps {
  transactions: GroupedPendingTxsWithTitle[]
  onEndReached: (info: { distanceFromEnd: number }) => void
  isLoading?: boolean
  amount: number
  hasMore: boolean
}

export function PendingTxListContainer({
  transactions,
  onEndReached,
  isLoading,
  hasMore,
  amount,
}: PendingTxListContainerProps) {
  const { handleScroll } = useScrollableHeader({
    children: (
      <>
        <NavBarTitle paddingRight={5}>Pending transactions</NavBarTitle>
        <Badge
          content={`${amount}${hasMore ? '+' : ''}`}
          circleSize={'$6'}
          fontSize={10}
          themeName="badge_warning_variant2"
        />
      </>
    ),
  })

  const LargeHeader = (
    <View flexDirection={'row'} alignItems={'flex-start'} paddingTop={'$3'}>
      <LargeHeaderTitle marginRight={5}>Pending transactions</LargeHeaderTitle>
      {isLoading ? (
        <Spinner size="large" color="$warning1ContrastTextDark" />
      ) : (
        <Badge content={`${amount}${hasMore ? '+' : ''}`} themeName="badge_warning_variant2" />
      )}
    </View>
  )

  return (
    <SectionList
      testID={'tx-history-list'}
      ListHeaderComponent={LargeHeader}
      sections={transactions}
      contentInsetAdjustmentBehavior="automatic"
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      ListFooterComponent={isLoading ? <Spinner size={'small'} color={'$color'} /> : undefined}
      renderSectionHeader={({ section: { title } }) => <SafeListItem.Header title={title} />}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    />
  )
}
