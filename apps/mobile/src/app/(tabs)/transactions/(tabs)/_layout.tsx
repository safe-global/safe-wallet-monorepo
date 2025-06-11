import React from 'react'

import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from '@react-navigation/material-top-tabs'
import { withLayoutContext } from 'expo-router'
import { ParamListBase, TabNavigationState } from '@react-navigation/native'
import { useTheme } from 'tamagui'
import { getMaterialTopTabBarScreenOptions } from '@/src/theme/helpers/tabBarStyles'

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
    <MaterialTopTabs screenOptions={getMaterialTopTabBarScreenOptions({ theme })}>
      <MaterialTopTabs.Screen name="index" options={{ title: 'History' }} />
      <MaterialTopTabs.Screen name="messages" options={{ title: 'Messages' }} />
    </MaterialTopTabs>
  )
}
