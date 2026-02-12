import React from 'react'
import { TabBarProps } from 'react-native-collapsible-tab-view'
import { TabName } from 'react-native-collapsible-tab-view/lib/typescript/src/types'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { View, Text, useTheme } from 'tamagui'

interface SafeTabBarProps {
  setActiveTab: (name: string) => void
  activeTab: string
  rightNode?: React.ReactNode
}

export const SafeTabBar = ({
  tabNames,
  onTabPress,
  activeTab,
  setActiveTab,
  rightNode,
}: TabBarProps<TabName> & SafeTabBarProps) => {
  const theme = useTheme()

  const activeButtonStyle = {
    paddingBottom: 8,
    borderBottomColor: theme.primary?.get(),
    borderBottomWidth: 2,
  }

  const handleTabPressed = (name: string) => () => {
    onTabPress(name)
    setActiveTab(name)
  }

  const isActiveTab = (name: string) => {
    return activeTab === name
  }

  return (
    <View
      backgroundColor="$background"
      gap="$6"
      paddingHorizontal="$4"
      flexDirection="row"
      borderBottomColor={'$borderLight'}
      borderBottomWidth={1}
      alignItems="center"
      justifyContent="space-between"
    >
      <View flexDirection="row" gap="$6">
        {tabNames.map((name) => (
          <TouchableOpacity style={isActiveTab(name) && activeButtonStyle} onPress={handleTabPressed(name)} key={name}>
            <Text color={isActiveTab(name) ? '$color' : '$colorSecondary'} fontSize="$6" fontWeight={700}>
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {rightNode && <View paddingBottom="$2">{rightNode}</View>}
    </View>
  )
}
