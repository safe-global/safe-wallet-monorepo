import { Stack } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

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
        options={{ headerShown: true, title: 'Signer', headerRight: () => <SafeFontIcon name={'edit'} size={20} /> }}
      />
    </Stack>
  )
}
