import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ConfirmTxContainer } from '@/src/features/ConfirmTx'
import { View } from 'tamagui'

function ConfirmTransactionPage() {
  const insets = useSafeAreaInsets()

  return (
    <View flex={1} paddingBottom={insets.bottom}>
      <ConfirmTxContainer />
    </View>
  )
}

export default ConfirmTransactionPage
