import React from 'react'
import { ImportSuccess } from '@/src/features/ImportSigner/components/ImportSuccess'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function ConnectSignerSuccess() {
  const { bottom } = useSafeAreaInsets()

  return (
    <View flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <ImportSuccess />
    </View>
  )
}

export default ConnectSignerSuccess
