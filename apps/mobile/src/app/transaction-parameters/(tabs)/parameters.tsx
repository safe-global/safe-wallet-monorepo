import React from 'react'
import { View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { TxParametersContainer } from '@/src/features/AdvancedDetails'

function TransactionParameters() {
  const insets = useSafeAreaInsets()

  return (
    <View flex={1} paddingBottom={insets.bottom} paddingHorizontal={16} marginTop={40}>
      <TxParametersContainer />
    </View>
  )
}

export default TransactionParameters
