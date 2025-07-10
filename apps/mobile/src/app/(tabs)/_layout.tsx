import { Tabs } from 'expo-router'
import React from 'react'
import { TabBarIcon } from '@/src/components/navigation/TabBarIcon'
import { Navbar as AssetsNavbar } from '@/src/features/Assets/components/Navbar/Navbar'
import { Pressable, StyleSheet } from 'react-native'
import { getTokenValue } from 'tamagui'
import { useTheme } from '@/src/theme/hooks/useTheme'

export default function TabLayout() {
  const { currentTheme } = useTheme()

  let activeTintColor, inactiveTintColor, borderTopColor
  if (currentTheme === 'light') {
    activeTintColor = getTokenValue('$color.textPrimaryLight')
    inactiveTintColor = getTokenValue('$color.primaryLightLight')
    borderTopColor = getTokenValue('$color.borderLightLight')
  } else {
    activeTintColor = getTokenValue('$color.textPrimaryDark')
    inactiveTintColor = getTokenValue('$color.primaryLightDark')
    borderTopColor = getTokenValue('$color.borderLightDark')
  }

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
