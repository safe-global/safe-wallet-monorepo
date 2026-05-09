import React from 'react'
import { View } from 'tamagui'
import { SignerContainer } from '@/src/features/Signer'

function SignerDetailsPage() {
  return (
    <View paddingHorizontal={'$4'} paddingVertical={'$4'} flex={1}>
      <SignerContainer />
    </View>
  )
}

export default SignerDetailsPage
