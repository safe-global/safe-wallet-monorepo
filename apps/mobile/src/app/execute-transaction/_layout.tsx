import { Stack } from 'expo-router'

export default function ExecuteTransactionLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  )
}
