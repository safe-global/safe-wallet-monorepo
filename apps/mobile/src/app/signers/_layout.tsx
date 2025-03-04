import { Stack } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'

export default function SignersLayout() {
  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: true, title: 'Signers' }} />
      <Stack.Screen name="signers/[address]" options={{ headerShown: true, title: '' }} />
    </Stack>
  )
}
