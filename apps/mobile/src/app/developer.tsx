import React from 'react'
import { View } from 'tamagui'
import { DeveloperContainer } from '@/src/features/Developer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function DeveloperScreen() {
  const { bottom } = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, paddingBottom: bottom }}>
      <DeveloperContainer />
    </View>
  )
}

export default DeveloperScreen
