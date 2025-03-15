import React from 'react'

import { AddSignersFormContainer } from '@/src/features/ImportReadOnly/AddSignersForm.container'
import { View } from 'tamagui'
import { useModalStyle } from '@/src/navigation/hooks/useModalStyle'

function ImportSignersFormScreen() {
  const modalStyle = useModalStyle()
  return (
    <View paddingHorizontal={'$4'} style={modalStyle} testID={'add-signers-form-screen'}>
      <AddSignersFormContainer />
    </View>
  )
}

export default ImportSignersFormScreen
