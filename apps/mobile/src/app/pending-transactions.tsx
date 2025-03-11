import React from 'react'
import { View } from 'tamagui'

import { PendingTxContainer } from '@/src/features/PendingTx'

function PendingScreen() {
  return (
    <View paddingHorizontal={'$3'}>
      <PendingTxContainer />
    </View>
  )
}

export default PendingScreen
