import React from 'react'

import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { TransactionActionsContainer } from '@/src/features/TransactionActions'
import { View } from 'tamagui'

function TransactionActions() {
  const { bottom } = useSafeAreaInsets()
  return (
    <View flex={1} paddingBottom={bottom}>
      <TransactionActionsContainer />
    </View>
  )
}

export default TransactionActions
