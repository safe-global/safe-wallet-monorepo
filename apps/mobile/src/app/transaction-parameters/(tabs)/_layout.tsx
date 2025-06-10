import React from 'react'

import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from '@react-navigation/material-top-tabs'
import { useLocalSearchParams, withLayoutContext } from 'expo-router'
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
  const { txId } = useLocalSearchParams<{ txId: string }>()

  return (
    <MaterialTopTabs
      screenOptions={{
        tabBarButtonTestID: 'tab-bar-buttons',
        tabBarStyle: {
          backgroundColor: 'transparent',
          shadowColor: 'transparent',
        },
        tabBarItemStyle: {
          width: 124,
          backgroundColor: 'transparent',
          shadowColor: 'transparent',
          alignSelf: 'center',
          borderBottomWidth: 0,
          left: -10,
        },
        tabBarIndicatorStyle: {
          backgroundColor: theme?.color?.get(),
          width: 94,
          marginLeft: 6,
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          color: theme?.color?.get(),
          fontSize: 16,
          fontWeight: '700',
        },
      }}
    >
      <MaterialTopTabs.Screen initialParams={{ txId }} name="index" options={{ title: 'Data' }} />
      <MaterialTopTabs.Screen initialParams={{ txId }} name="parameters" options={{ title: 'Parameters' }} />
    </MaterialTopTabs>
  )
}
