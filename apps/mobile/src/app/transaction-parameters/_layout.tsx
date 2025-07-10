import { Stack } from 'expo-router'
import React from 'react'
import { View } from 'tamagui'
import { LargeHeaderTitle } from '@/src/components/Title'

export default function TransactionsParametersLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: false,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={() => ({
          headerShown: false,
        })}
      />
    </Stack>
  )
}
