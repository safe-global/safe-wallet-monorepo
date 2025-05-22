import React from 'react'

import { AddSignersFormContainer } from '@/src/features/ImportReadOnly/AddSignersForm.container'
import { View } from 'tamagui'

function ImportSignersFormScreen() {
  return (
    <View paddingHorizontal={'$4'} style={{ flex: 1 }} testID={'add-signers-form-screen'}>
      <AddSignersFormContainer />
    </View>
  )
}

export default ImportSignersFormScreen
