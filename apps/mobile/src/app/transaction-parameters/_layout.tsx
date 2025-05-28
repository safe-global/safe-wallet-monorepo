import { Stack } from 'expo-router'
import React from 'react'
import { H2, View } from 'tamagui'

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
              <H2 fontWeight={600} {...props}>
                Advanced details
              </H2>
            </View>
          ),
        })}
      />
    </Stack>
  )
}
