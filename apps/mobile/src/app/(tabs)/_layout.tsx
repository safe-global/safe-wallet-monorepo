import { Tabs } from 'expo-router'
import React from 'react'
import { TabBarIcon } from '@/src/components/navigation/TabBarIcon'
import { Navbar as AssetsNavbar } from '@/src/features/Assets/components/Navbar/Navbar'
import { Pressable, StyleSheet } from 'react-native'
import { useTheme } from 'tamagui'
import TransactionHeader from '@/src/features/TxHistory/components/TransactionHeader'

export default function TabLayout() {
  const theme = useTheme()

  const activeTintColor = theme.color.get()
  const inactiveTintColor = theme.borderMain.get()
  const borderTopColor = theme.borderLight.get()

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarStyle: { ...styles.tabBar, borderTopColor },
          tabBarLabelStyle: styles.label,
          tabBarActiveTintColor: activeTintColor,
          tabBarInactiveTintColor: inactiveTintColor,
        }}
      >
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
            tabBarIcon: ({ color }) => <TabBarIcon name={'home'} color={color} />,
          }}
        />

        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transactions',
            headerTitle: () => <TransactionHeader />,
            headerStyle: { shadowColor: 'transparent' },
            headerLeftContainerStyle: { flexGrow: 0 },
            tabBarButtonTestID: 'transactions-tab',
            tabBarLabel: 'Transactions',
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
              title: 'Account',
              headerShown: false,
              tabBarButtonTestID: 'account-tab',
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
    padding: 8,
  },
  tabBar: {
    width: '100%',
    margin: 'auto',
    height: 64,
    boxSizing: 'content-box',
    borderTopWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 16,
    marginTop: 8,
  },
})
