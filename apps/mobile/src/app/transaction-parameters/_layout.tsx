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
          headerTitle: (props) => (
            <View width="100%" flex={1} marginTop={2}>
              <LargeHeaderTitle fontWeight={600} {...props}>
                Transaction details
              </LargeHeaderTitle>
            </View>
          ),
        })}
      />
    </Stack>
  )
}
