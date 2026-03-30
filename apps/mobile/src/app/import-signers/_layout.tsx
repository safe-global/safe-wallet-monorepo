import { useCallback } from 'react'
import { Pressable } from 'react-native'
import { Stack, router } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { useScreenProtection } from '@/src/hooks/useScreenProtection'
import { HeaderBackButton } from '@react-navigation/elements'
import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useAppKit } from '@reown/appkit-react-native'

function CloseButton({ onPress, testID }: { onPress: () => void; testID: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} testID={testID}>
      <View
        backgroundColor="$backgroundSkeleton"
        alignItems="center"
        justifyContent="center"
        borderRadius={200}
        height={40}
        width={40}
      >
        <SafeFontIcon name="close" size={24} color="$color" />
      </View>
    </Pressable>
  )
}

export default function ImportSignersLayout() {
  useScreenProtection()
  const { disconnect } = useAppKit()

  const handleLedgerSuccessClose = () => {
    router.dismissAll()
    router.navigate('/signers')
  }

  const handleErrorClose = useCallback(() => {
    router.dismissAll()
  }, [])

  const handleNameSignerClose = useCallback(async () => {
    try {
      await disconnect()
    } catch {
      // Always navigate even if disconnect fails
    }

    router.dismissAll()
  }, [disconnect])

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
      <Stack.Screen
        name="name-signer"
        options={{
          headerShown: true,
          title: '',
          headerRight: () => <CloseButton onPress={handleNameSignerClose} testID="name-signer-close" />,
        }}
      />
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
