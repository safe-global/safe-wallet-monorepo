import { Tabs } from 'expo-router'
import React from 'react'
import { TabBarIcon } from '@/src/components/navigation/TabBarIcon'
import { Navbar as AssetsNavbar } from '@/src/features/Assets/components/Navbar/Navbar'
import useNotifications from '@/src/hooks/useNotifications'

export default function TabLayout() {
  /**
   * Enables notifications for the app if the user has enabled them
   */
  useNotifications()

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          header: AssetsNavbar,
          title: 'Home',
          tabBarButtonTestID: 'tabHome',
          tabBarIcon: ({ color }) => <TabBarIcon name={'wallet'} color={color} />,
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          headerShown: false,
          tabBarButtonTestID: 'tabTransactions',
          tabBarIcon: ({ color }) => <TabBarIcon name={'transactions'} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={() => {
          return {
            title: 'Settings',
            headerShown: false,
            tabBarButtonTestID: 'tabSettings',
            tabBarIcon: ({ color }) => <TabBarIcon name={'settings'} color={color} />,
          }
        }}
      />
    </Tabs>
  )
}
