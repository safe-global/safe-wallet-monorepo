import React from 'react'
import { ImportSigner } from '@/src/features/ImportSigner'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function PrivateKeyImport() {
  const { bottom } = useSafeAreaInsets()

  return (
    <View paddingHorizontal={'$4'} flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <ImportSigner />
    </View>
  )
}

export default PrivateKeyImport
