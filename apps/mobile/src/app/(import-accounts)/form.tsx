import React from 'react'
import { ImportAccountFormContainer } from '@/src/features/ImportReadOnly'
import { View } from 'tamagui'

function ImportAccountFormScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ImportAccountFormContainer />
    </View>
  )
}

export default ImportAccountFormScreen
