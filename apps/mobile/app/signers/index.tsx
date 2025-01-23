import React from 'react'
import { SignersContainer } from '@/src/features/Signers'
import { SafeAreaView } from 'react-native-safe-area-context'

function SignersScreen() {
  return (
    <SafeAreaView edges={['bottom']}>
      <SignersContainer />
    </SafeAreaView>
  )
}

export default SignersScreen
