import { Stack } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { SignerHeader } from '@/src/features/Signer/components/SignerHeader'

export default function SignersLayout() {
  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: true, title: 'Signers' }} />
      <Stack.Screen
        name="[address]"
        options={{
          headerShown: true,
          headerTitle: SignerHeader,
        }}
      />
    </Stack>
  )
}
