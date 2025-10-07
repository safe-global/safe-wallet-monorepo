import React from 'react'

import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { View } from 'tamagui'

import { TxDataContainer } from '@/src/features/AdvancedDetails'

function TransactionData() {
  const { bottom } = useSafeAreaInsets()
  return (
    <View flex={1} paddingHorizontal={16} marginTop={40} paddingBottom={bottom}>
      <TxDataContainer />
    </View>
  )
}

export default TransactionData
