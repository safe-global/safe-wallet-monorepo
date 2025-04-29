import React from 'react'
import { ShareContainer } from '@/src/features/Share'
import { View } from 'tamagui'

function ShareScreen() {
  return (
    <View style={{ flex: 1 }} paddingHorizontal={'$4'}>
      <ShareContainer />
    </View>
  )
}

export default ShareScreen
