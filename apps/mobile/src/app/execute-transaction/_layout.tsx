import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { Stack } from 'expo-router'

export default function ExecuteTransactionLayout() {
  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
      })}
    >
      <Stack.Screen name="ledger-connect" options={{ headerShown: true, title: '', headerLeft: () => null }} />
      <Stack.Screen name="ledger-pairing" options={{ headerShown: false, title: '' }} />
      <Stack.Screen name="ledger-review" options={{ headerShown: true, title: '' }} />
    </Stack>
  )
}
