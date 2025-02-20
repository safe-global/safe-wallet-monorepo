import React from 'react'
import { CircleSnail } from 'react-native-progress'
import { View } from 'tamagui'

export function LoadingTx() {
  return (
    <View flex={1} width="100%" justifyContent="center" alignItems="center">
      <CircleSnail size={64} color={['#12FF80']} />
    </View>
  )
}
