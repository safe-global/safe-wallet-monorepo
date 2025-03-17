import React, { useCallback } from 'react'
import { Theme, View } from 'tamagui'
import { TxInfo } from '@/src/components/TxInfo'
import { Alert } from '@/src/components/Alert'
import { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxCardPress } from '@/src/components/TxInfo/types'
import { TouchableOpacity } from 'react-native'
interface TxConflictingCard {
  transactions: TransactionQueuedItem[]
  inQueue?: boolean
  onPress: (transaction?: TxCardPress) => void
}

function TxConflictingComponent({ transactions, inQueue, onPress }: TxConflictingCard) {
  const handleConflictTxPress = useCallback(
    (transaction?: TransactionQueuedItem) => {
      if (transaction) {
        onPress({
          tx: transaction.transaction,
        })
      }
    },
    [onPress],
  )

  return (
    <View>
      <TouchableOpacity onPress={() => onPress()}>
        <View marginTop={12}>
          <Alert type="warning" message="Conflicting transactions" />
        </View>
      </TouchableOpacity>

      <Theme name="warning">
        {transactions.map((item, index) => (
          <View backgroundColor="$background" width="100%" key={`${item.transaction.id}-${index}`} marginTop={12}>
            <TxInfo inQueue={inQueue} tx={item.transaction} onPress={() => handleConflictTxPress(item)} bordered />
          </View>
        ))}
      </Theme>
    </View>
  )
}

export const TxConflictingCard = React.memo(TxConflictingComponent, (prevProps, nextProps) => {
  return prevProps.transactions.length === nextProps.transactions.length
})
