import React from 'react'
import { ImportPrivateKey } from '@/src/features/ImportPrivateKey'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function PrivateKeyImport() {
  const { bottom } = useSafeAreaInsets()
  return (
    <View flex={1} paddingBottom={bottom + getTokenValue('$4')}>
      <ImportPrivateKey />
    </View>
  )
}

export default PrivateKeyImport
