import { Stack } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function ImportAccountsLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={({ navigation }) => ({
          ...getDefaultScreenOptions(navigation.goBack),
        })}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="form" options={{ headerShown: true }} />
        <Stack.Screen name="signers" options={{ headerShown: true }} />
      </Stack>
    </SafeAreaProvider>
  )
}
