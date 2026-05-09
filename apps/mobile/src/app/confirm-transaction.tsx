import React from 'react'
import { ConfirmTxContainer } from '@/src/features/ConfirmTx'
import { View } from 'tamagui'

function ConfirmTransactionPage() {
  return (
    <View flex={1}>
      <ConfirmTxContainer />
    </View>
  )
}

export default ConfirmTransactionPage
