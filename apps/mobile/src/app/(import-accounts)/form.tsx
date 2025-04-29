import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ImportAccountFormContainer } from '@/src/features/ImportReadOnly'
import { View } from 'tamagui'

function ImportAccountFormScreen() {
  const { bottom } = useSafeAreaInsets()
  return (
    <View style={{ flex: 1 }}>
      <ImportAccountFormContainer />
    </View>
  )
}

export default ImportAccountFormScreen
