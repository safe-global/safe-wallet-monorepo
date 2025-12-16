import React from 'react'
import { SignersContainer } from '@/src/features/Signers'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function SignersScreen() {
  const { bottom } = useSafeAreaInsets()

  return (
    <View flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))} paddingHorizontal={getTokenValue('$4')}>
      <SignersContainer />
    </View>
  )
}

export default SignersScreen
