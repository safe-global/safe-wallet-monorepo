import React from 'react'
import { ConnectSignerError } from '@/src/features/ImportSigner/components/ConnectSignerError'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function ConnectSignerErrorScreen() {
  const { bottom } = useSafeAreaInsets()

  return (
    <View flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <ConnectSignerError />
    </View>
  )
}

export default ConnectSignerErrorScreen
