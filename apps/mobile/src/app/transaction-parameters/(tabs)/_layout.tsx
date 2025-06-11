import React from 'react'

import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from '@react-navigation/material-top-tabs'
import { useLocalSearchParams, withLayoutContext } from 'expo-router'
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
  const { txId } = useLocalSearchParams<{ txId: string }>()

  return (
    <MaterialTopTabs
      screenOptions={getMaterialTopTabBarScreenOptions({
        theme,
        tabBarItemWidth: 124,
        tabBarIndicatorWidth: 94,
        tabBarLabelFontSize: 16,
        tabBarLabelFontWeight: '700',
        tabBarItemLeft: -10,
      })}
    >
      <MaterialTopTabs.Screen initialParams={{ txId }} name="index" options={{ title: 'Data' }} />
      <MaterialTopTabs.Screen initialParams={{ txId }} name="parameters" options={{ title: 'Parameters' }} />
    </MaterialTopTabs>
  )
}
