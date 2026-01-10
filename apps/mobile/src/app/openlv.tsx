import React from 'react'
import { OpenLVContainer } from '@/src/features/OpenLV'
import { View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function OpenLVScreen() {
  const { bottom } = useSafeAreaInsets()
  return (
    <View flex={1} paddingBottom={bottom}>
      <OpenLVContainer />
    </View>
  )
}

export default OpenLVScreen
