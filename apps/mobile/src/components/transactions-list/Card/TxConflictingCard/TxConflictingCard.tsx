import React, { useCallback } from 'react'
import { Theme, View } from 'tamagui'
import { TxInfo } from '@/src/components/TxInfo'
import { Alert } from '@/src/components/Alert'
import { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxConflictCardPress } from '@/src/components/TxInfo/types'
interface TxConflictingCard {
  transactions: TransactionQueuedItem[]
  inQueue?: boolean
  onPress: (transaction: TxConflictCardPress, isConflict?: boolean) => void
}

function TxConflictingComponent({ transactions, inQueue, onPress }: TxConflictingCard) {
  const handleConflictTxPress = useCallback(() => {
    onPress(
      {
        transactions,
      },
      true,
    )
  }, [onPress, transactions])

  return (
    <View onPress={handleConflictTxPress}>
      <View marginTop={12}>
        <Alert type="warning" message="Conflicting transactions" />
      </View>

      <Theme name="warning">
        {transactions.map((item, index) => (
          <View backgroundColor="$background" width="100%" key={`${item.transaction.id}-${index}`} marginTop={12}>
            <TxInfo inQueue={inQueue} tx={item.transaction} onPress={handleConflictTxPress} bordered />
          </View>
        ))}
      </Theme>
    </View>
  )
}

export const TxConflictingCard = React.memo(TxConflictingComponent, (prevProps, nextProps) => {
  return prevProps.transactions.length === nextProps.transactions.length
})
