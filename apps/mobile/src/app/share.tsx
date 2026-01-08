import React from 'react'
import { ShareContainer } from '@/src/features/Share'
import { View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
function ShareScreen() {
  const { bottom } = useSafeAreaInsets()
  return (
    <View style={{ flex: 1 }} paddingHorizontal={'$4'} paddingBottom={bottom}>
      <ShareContainer />
    </View>
  )
}

export default ShareScreen
