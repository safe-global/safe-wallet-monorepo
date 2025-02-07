import { Stack } from 'expo-router'
import React from 'react'
import type { Route } from '@react-navigation/routers'

import { getFocusedRouteNameFromRoute } from '@react-navigation/native'

const getHeaderTitle = (route: Partial<Route<string>>) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'index'
  const name = {
    ['index']: 'Transactions',
    ['messages']: 'Messages',
  }[routeName]
  return name || 'Transactions'
}

export default function TransactionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: false,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={({ route }) => ({
          headerTitle: getHeaderTitle(route),
        })}
      />
    </Stack>
  )
}
