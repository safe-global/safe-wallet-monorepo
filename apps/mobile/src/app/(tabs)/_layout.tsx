import { Tabs } from 'expo-router'
import React from 'react'
import { BlurView } from 'expo-blur'
import { TabBarIcon } from '@/src/components/navigation/TabBarIcon'
import { Navbar as AssetsNavbar } from '@/src/features/Assets/components/Navbar/Navbar'
import { Pressable, StyleSheet } from 'react-native'
import { useTheme, View } from 'tamagui'
import { useTheme as useCurrentTheme } from '@/src/theme/hooks/useTheme'
import TransactionHeader from '@/src/features/TxHistory/components/TransactionHeader'
import { isAndroid } from '@/src/config/constants'

function TabBarBackground() {
  const { isDark } = useCurrentTheme()

  // expo-blur on Android requires BlurTargetView wrapping the content behind the blur,
  // but the tab navigator's internal view hierarchy prevents the ref from capturing screen
  // content. See https://github.com/expo/expo/issues/44165
  if (isAndroid) {
    return <View style={StyleSheet.absoluteFill} backgroundColor={'$backgroundSheet'} opacity={0.98} />
  }

  return <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
}

export default function TabLayout() {
  const theme = useTheme()

  const activeTintColor = React.useMemo(() => theme.color.get(), [theme])
  const inactiveTintColor = React.useMemo(() => theme.borderMain.get(), [theme])
  const borderTopColor = React.useMemo(() => theme.borderLight.get(), [theme])

  const screenOptions = React.useMemo(
    () => ({
      tabBarStyle: { ...styles.tabBar, borderTopColor },
      tabBarLabelStyle: styles.label,
      tabBarActiveTintColor: activeTintColor,
      tabBarInactiveTintColor: inactiveTintColor,
      tabBarBackground: () => <TabBarBackground />,
    }),
    [borderTopColor, activeTintColor, inactiveTintColor],
  )

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          header: () => <AssetsNavbar />,
          title: 'Home',
          tabBarButtonTestID: 'home-tab',
          tabBarButton: ({ children, ref, ...rest }) => {
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
          tabBarButton: ({ children, ref, ...rest }) => {
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
        options={{
          title: 'Account',
          headerShown: false,
          tabBarButtonTestID: 'account-tab',
          tabBarButton: ({ children, ref, ...rest }) => {
            return (
              <Pressable {...rest} style={styles.tabButton}>
                {children}
              </Pressable>
            )
          },
          tabBarIcon: ({ color }) => <TabBarIcon name={'wallet'} color={color} />,
        }}
      />
    </Tabs>
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
    position: 'absolute',
    backgroundColor: 'transparent',
    elevation: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    boxSizing: 'content-box',
  },
  label: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 16,
    letterSpacing: 0.1,
    marginTop: 4,
  },
})
