import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ConfirmTxContainer } from '@/src/features/ConfirmTx'
import { getTokenValue, View } from 'tamagui'

function ConfirmTransactionPage() {
  const insets = useSafeAreaInsets()

  return (
    <View flex={1} paddingBottom={Math.max(insets.bottom, getTokenValue('$4'))}>
      <ConfirmTxContainer />
    </View>
  )
}

export default ConfirmTransactionPage
