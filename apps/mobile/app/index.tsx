import React from 'react'
import { View } from 'tamagui'
import { ActivityIndicator } from 'react-native'

function IndexScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}

export default IndexScreen
