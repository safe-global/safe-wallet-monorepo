import React from 'react'
import { View } from 'tamagui'
import { ImportSignersContainer } from '@/src/features/ImportSigners'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
function ImportSignersPage() {
  const { bottom } = useSafeAreaInsets()

  return (
    <View style={{ flex: 1 }} paddingBottom={bottom}>
      <ImportSignersContainer />
    </View>
  )
}

export default ImportSignersPage
