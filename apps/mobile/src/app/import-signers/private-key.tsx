import React from 'react'
import { ImportPrivateKey } from '@/src/features/ImportPrivateKey'
import { View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function PrivateKeyImport() {
  const insets = useSafeAreaInsets()
  return (
    <View paddingHorizontal={'$4'} flex={1} paddingBottom={insets.bottom}>
      <ImportPrivateKey />
    </View>
  )
}

export default PrivateKeyImport
