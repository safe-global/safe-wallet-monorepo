import React from 'react'
import { Stack } from 'expo-router'
import { View } from 'tamagui'
import { AuthenticatorContainer } from '@/src/features/Authenticator'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function AuthenticatorScreen() {
  const { bottom } = useSafeAreaInsets()
  return (
    <>
      <Stack.Screen options={{ title: 'Authenticator' }} />
      <View style={{ flex: 1, paddingBottom: bottom }}>
        <AuthenticatorContainer />
      </View>
    </>
  )
}

export default AuthenticatorScreen
