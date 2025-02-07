import React from 'react'

import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from '@react-navigation/material-top-tabs'
import { withLayoutContext } from 'expo-router'
import { ParamListBase, TabNavigationState } from '@react-navigation/native'
import { useTheme } from 'tamagui'

const { Navigator } = createMaterialTopTabNavigator()

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator)

export default function TransactionsLayout() {
  const theme = useTheme()

  return (
    <MaterialTopTabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'transparent',
          shadowColor: 'transparent',
        },
        tabBarItemStyle: {
          backgroundColor: 'transparent',
          shadowColor: 'transparent',
          width: 100,
          alignSelf: 'center',
          borderBottomWidth: 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: theme?.color?.get(),
          width: 100,
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          color: theme?.color?.get(),
          fontSize: 14,
          fontWeight: '600',
        },
      }}
    >
      <MaterialTopTabs.Screen name="index" options={{ title: 'History' }} />
      <MaterialTopTabs.Screen name="messages" options={{ title: 'Messages' }} />
    </MaterialTopTabs>
  )
}
