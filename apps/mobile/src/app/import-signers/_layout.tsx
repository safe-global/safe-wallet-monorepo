import { Stack } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'

export default function ImportSignersLayout() {
  return (
    <Stack
      screenOptions={({ navigation }) => ({
        ...getDefaultScreenOptions(navigation.goBack),
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: true, title: '' }} />
      <Stack.Screen name="private-key" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="loading"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="private-key-error"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="private-key-success"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  )
}
