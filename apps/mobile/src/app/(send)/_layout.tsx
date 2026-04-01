import { Stack, useRouter } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { View, Text, useTheme } from 'tamagui'
import { Loader } from '@/src/components/Loader'
import { CloseButton } from '@/src/components/CloseButton'

export default function SendLayout() {
  const router = useRouter()
  const safeSDK = useSafeSDK()
  const theme = useTheme()

  if (!safeSDK) {
    return (
      <View flex={1} justifyContent="center" alignItems="center" gap="$3">
        <Loader size={48} color={String(theme.primary.get())} />
        <Text color="$colorSecondary">Initializing Safe SDK...</Text>
      </View>
    )
  }

  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
        headerRight: () => <CloseButton onPress={() => router.dismissTo('/(tabs)')} testID="close-send-flow" />,
      })}
    >
      <Stack.Screen name="recipient" options={{ title: 'Send' }} />
      <Stack.Screen name="scan-qr" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="token" options={{ title: 'Send' }} />
      <Stack.Screen name="amount" options={{ title: 'Send' }} />
    </Stack>
  )
}
