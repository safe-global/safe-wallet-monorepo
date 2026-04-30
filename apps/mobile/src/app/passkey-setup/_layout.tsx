import { Stack, useRouter } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { PasskeySetupProvider } from '@/src/features/PasskeySetup/context/PasskeySetupProvider'
import { HeaderBackButton } from '@react-navigation/elements'
import { View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export default function PasskeySetupLayout() {
  const router = useRouter()

  const closeButton = () => (
    <HeaderBackButton
      testID="close-passkey-setup"
      onPress={() => router.dismissAll()}
      backImage={() => (
        <View
          backgroundColor="$backgroundSkeleton"
          alignItems="center"
          justifyContent="center"
          borderRadius={200}
          height={40}
          width={40}
        >
          <SafeFontIcon name="close" size={16} color="$color" />
        </View>
      )}
      displayMode="minimal"
    />
  )

  return (
    <PasskeySetupProvider>
      <Stack
        screenOptions={({ navigation }) => ({
          ...getDefaultScreenOptions(navigation.goBack),
        })}
      >
        <Stack.Screen
          name="info"
          options={{
            headerShown: true,
            title: 'Create passkey signer',
            headerRight: closeButton,
          }}
        />
        <Stack.Screen
          name="name"
          options={{
            headerShown: true,
            title: '',
            headerRight: closeButton,
          }}
        />
        <Stack.Screen
          name="creating"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="success"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="error"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack>
    </PasskeySetupProvider>
  )
}
