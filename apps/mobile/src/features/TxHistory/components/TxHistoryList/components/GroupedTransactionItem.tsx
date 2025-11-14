import React from 'react'
import { View } from 'tamagui'
import { HistoryTransactionItems } from '@safe-global/store/gateway/types'
import { TxGroupedCard } from '@/src/components/transactions-list/Card/TxGroupedCard'
import { TxCardPress } from '@/src/components/TxInfo/types'

interface GroupedTransactionItemProps {
  item: HistoryTransactionItems[]
  onPress: (transaction: TxCardPress) => void
}

const GroupedTransactionItemComponent = ({ item, onPress }: GroupedTransactionItemProps) => {
  const transactionItems = item.filter((tx) => tx.type === 'TRANSACTION')
  if (transactionItems.length === 0) {
    return null
  }

  return (
    <View marginTop="$4">
      <TxGroupedCard transactions={transactionItems} onPress={onPress} />
    </View>
  )
}

export const GroupedTransactionItem = React.memo(GroupedTransactionItemComponent)
GroupedTransactionItem.displayName = 'GroupedTransactionItem'
