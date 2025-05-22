import { Loader } from '@/src/components/Loader'
import React from 'react'
import { View } from 'tamagui'

export function LoadingTx() {
  return (
    <View flex={1} width="100%" justifyContent="center" alignItems="center">
      <Loader size={64} color="#12FF80" />
    </View>
  )
}
