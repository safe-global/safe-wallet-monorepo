import React from 'react'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YourSignersListContainer } from '@/src/features/YourSigners'

function YourSignersScreen() {
  const { bottom } = useSafeAreaInsets()

  return (
    <View flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))} paddingHorizontal={getTokenValue('$4')}>
      <YourSignersListContainer />
    </View>
  )
}

export default YourSignersScreen
