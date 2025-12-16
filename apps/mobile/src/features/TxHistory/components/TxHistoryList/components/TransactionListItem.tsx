import React from 'react'
import { View } from 'tamagui'
import { HistoryTransactionItems } from '@safe-global/store/gateway/types'
import { TxInfo } from '@/src/components/TxInfo'
import { TxCardPress } from '@/src/components/TxInfo/types'

interface TransactionListItemProps {
  item: HistoryTransactionItems
  onPress: (transaction: TxCardPress) => void
}

const TransactionListItemComponent = ({ item, onPress }: TransactionListItemProps) => {
  if (item.type !== 'TRANSACTION') {
    return null
  }

  return (
    <View marginTop="$4">
      <TxInfo tx={item.transaction} onPress={onPress} />
    </View>
  )
}

export const TransactionListItem = React.memo(TransactionListItemComponent)
TransactionListItem.displayName = 'TransactionListItem'
