import { Tabs } from 'expo-router'
import React from 'react'
import { TabBarIcon } from '@/src/components/navigation/TabBarIcon'
import { Navbar as AssetsNavbar } from '@/src/features/Assets/components/Navbar/Navbar'
import { Pressable, StyleSheet } from 'react-native'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarShowLabel: false }}>
      <Tabs.Screen
        name="index"
        options={{
          header: AssetsNavbar,
          title: 'Home',
          tabBarButtonTestID: 'home-tab',
          tabBarButton: ({ children, ...rest }) => {
            return (
              <Pressable {...rest} style={styles.homeTab}>
                {children}
              </Pressable>
            )
          },
          tabBarIcon: ({ color }) => <TabBarIcon name={'token'} color={color} />,
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          headerShown: false,
          tabBarButtonTestID: 'transactions-tab',
          tabBarItemStyle: {
            paddingTop: 10,
          },
          tabBarIcon: ({ color }) => <TabBarIcon name={'transactions'} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={() => {
          return {
            title: 'Settings',
            headerShown: false,
            tabBarButtonTestID: 'settings-tab',
            tabBarButton: ({ children, ...rest }) => {
              return (
                <Pressable {...rest} style={styles.settingsTab}>
                  {children}
                </Pressable>
              )
            },
            tabBarIcon: ({ color }) => <TabBarIcon name={'wallet'} color={color} />,
          }
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  homeTab: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 15,
  },
  settingsTab: {
    flex: 1,
    alignItems: 'flex-start',
    paddingTop: 15,
  },
})
