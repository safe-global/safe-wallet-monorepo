import { Stack } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'

export default function SignTransactionLayout() {
  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
      })}
    >
      <Stack.Screen
        name="ledger-connect"
        options={{
          headerShown: true,
          title: '',
        }}
      />
      <Stack.Screen name="ledger-pairing" options={{ headerShown: false, title: '' }} />
      <Stack.Screen name="ledger-review" options={{ headerShown: true, title: '' }} />
    </Stack>
  )
}
