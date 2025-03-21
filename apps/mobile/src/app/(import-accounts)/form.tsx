import React from 'react'

import { ImportAccountFormContainer } from '@/src/features/ImportReadOnly'
import { View } from 'tamagui'
import { useModalStyle } from '@/src/navigation/hooks/useModalStyle'

function ImportAccountFormScreen() {
  const modalStyle = useModalStyle()
  return (
    <View style={modalStyle}>
      <ImportAccountFormContainer />
    </View>
  )
}

export default ImportAccountFormScreen
