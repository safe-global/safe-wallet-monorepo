import React from 'react'
import { ShareContainer } from '@/src/features/Share'
import { View } from 'tamagui'
import { useModalStyle } from '@/src/navigation/hooks/useModalStyle'

function ShareScreen() {
  const modalStyle = useModalStyle()
  return (
    <View style={modalStyle} paddingHorizontal={'$4'}>
      <ShareContainer />
    </View>
  )
}

export default ShareScreen
