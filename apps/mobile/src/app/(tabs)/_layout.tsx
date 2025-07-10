import { Tabs } from 'expo-router'
import React from 'react'
import { TabBarIcon } from '@/src/components/navigation/TabBarIcon'
import { Navbar as AssetsNavbar } from '@/src/features/Assets/components/Navbar/Navbar'
import { Pressable, StyleSheet } from 'react-native'

export default function TabLayout() {
  return (
    <>
      <Tabs screenOptions={{ tabBarShowLabel: false, tabBarStyle: styles.tabBar }}>
        <Tabs.Screen
          name="index"
          options={{
            header: AssetsNavbar,
            title: 'Home',
            tabBarButtonTestID: 'home-tab',
            tabBarButton: ({ children, ...rest }) => {
              return (
                <Pressable {...rest} style={styles.tabButton}>
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
            tabBarButton: ({ children, ...rest }) => {
              return (
                <Pressable {...rest} style={styles.tabButton}>
                  {children}
                </Pressable>
              )
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
                  <Pressable {...rest} style={styles.tabButton}>
                    {children}
                  </Pressable>
                )
              },
              tabBarIcon: ({ color }) => <TabBarIcon name={'wallet'} color={color} />,
            }
          }}
        />
      </Tabs>
    </>
  )
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    width: '60%',
    margin: 'auto',
  },
})
