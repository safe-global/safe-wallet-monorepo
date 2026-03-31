import { useCallback } from 'react'
import { Stack, router } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { useScreenProtection } from '@/src/hooks/useScreenProtection'
import { HeaderBackButton } from '@react-navigation/elements'
import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { CloseButton } from '@/src/components/CloseButton'

export default function ImportSignersLayout() {
  useScreenProtection()

  const handleLedgerSuccessClose = () => {
    router.dismissAll()
    router.navigate('/signers')
  }

  const handleErrorClose = useCallback(() => {
    router.dismissAll()
  }, [])

  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="private-key" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="loading"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="private-key-error"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="private-key-success"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen name="name-signer" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="connect-signer-success"
        options={{
          presentation: 'containedModal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="connect-signer-error"
        options={{
          presentation: 'containedModal',
          headerShown: true,
          title: '',
          headerShadowVisible: false,
          headerTransparent: true,
          headerLeft: () => null,
          headerRight: () => <CloseButton onPress={handleErrorClose} testID="connect-signer-error-close" />,
        }}
      />
      <Stack.Screen name="hardware-devices" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="ledger-connect" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="ledger-pairing" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="ledger-addresses" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="ledger-success"
        options={{
          // presentation: 'modal',
          headerShown: true,
          title: '',
          headerShadowVisible: false,
          headerTransparent: true,
          headerLeft: () => (
            <HeaderBackButton
              style={{ marginLeft: -8 }}
              testID="ledger-success-close"
              onPress={handleLedgerSuccessClose}
              backImage={() => (
                <View
                  backgroundColor="$backgroundSkeleton"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius={16}
                  height={32}
                  width={32}
                >
                  <SafeFontIcon name="close" size={16} color="$color" />
                </View>
              )}
              displayMode="minimal"
            />
          ),
        }}
      />
    </Stack>
  )
}
