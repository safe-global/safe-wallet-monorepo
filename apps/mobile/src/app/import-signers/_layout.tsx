import { Stack, useFocusEffect } from 'expo-router'
import { getDefaultScreenOptions } from '@/src/navigation/hooks/utils'
import { useCallback } from 'react'
import { CaptureProtection } from 'react-native-capture-protection'
export default function ImportSignersLayout() {
  // Enable capture protection when the whole group is focused
  // and disable when the group is unfocused
  useFocusEffect(
    useCallback(() => {
      CaptureProtection.prevent({
        screenshot: true,
        record: true,
        appSwitcher: true,
      })

      return () => {
        CaptureProtection.allow()
      }
    }, []),
  )

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
