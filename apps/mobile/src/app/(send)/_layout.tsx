import { Stack } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { View, Text } from 'tamagui'
import { Loader } from '@/src/components/Loader'

export default function SendLayout() {
  const safeSDK = useSafeSDK()

  if (!safeSDK) {
    return (
      <View flex={1} justifyContent="center" alignItems="center" gap="$3">
        <Loader size={48} color="#12FF80" />
        <Text color="$colorSecondary">Initializing Safe SDK...</Text>
      </View>
    )
  }

  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
      })}
    >
      <Stack.Screen name="recipient" options={{ title: 'Send' }} />
      <Stack.Screen name="token" options={{ title: 'Select token' }} />
      <Stack.Screen name="amount" options={{ title: 'Enter amount' }} />
      <Stack.Screen name="review" options={{ title: 'Review' }} />
    </Stack>
  )
}
