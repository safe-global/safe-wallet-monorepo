import { Stack } from 'expo-router'
import React from 'react'

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
