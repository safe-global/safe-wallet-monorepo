import React from 'react'
import { TabBarProps } from 'react-native-collapsible-tab-view'
import { TabName } from 'react-native-collapsible-tab-view/lib/typescript/src/types'
import { Pressable } from 'react-native'
import { View, useTheme } from 'tamagui'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'

interface SafeTabBarProps {
  rightNode?: (tabName: string) => React.ReactNode
}

const TabItem = ({
  name,
  index,
  indexDecimal,
  onPress,
  activeColor,
  inactiveColor,
  activeBorderColor,
}: {
  name: string
  index: number
  indexDecimal: SharedValue<number>
  onPress: (name: string) => void
  activeColor: string
  inactiveColor: string
  activeBorderColor: string
}) => {
  const textStyle = useAnimatedStyle(() => ({
    color: Math.abs(index - indexDecimal.value) < 0.5 ? activeColor : inactiveColor,
  }))

  const borderStyle = useAnimatedStyle(() => ({
    borderBottomColor: Math.abs(index - indexDecimal.value) < 0.5 ? activeBorderColor : 'transparent',
  }))

  return (
    <Pressable onPress={() => onPress(name)}>
      <Animated.View style={[tabItemStyle, borderStyle]}>
        <Animated.Text style={[tabItemTextStyle, textStyle]}>{name}</Animated.Text>
      </Animated.View>
    </Pressable>
  )
}

const RightNodeItem = ({
  index,
  indexDecimal,
  children,
}: {
  index: number
  indexDecimal: SharedValue<number>
  children: React.ReactNode
}) => {
  const style = useAnimatedStyle(() => ({
    opacity: Math.abs(index - indexDecimal.value) < 0.5 ? 1 : 0,
  }))

  return <Animated.View style={style}>{children}</Animated.View>
}

export const SafeTabBar = ({
  tabNames,
  indexDecimal,
  onTabPress,
  rightNode,
}: TabBarProps<TabName> & SafeTabBarProps) => {
  const theme = useTheme()
  const activeColor = theme.color.get() ?? '#000'
  const inactiveColor = theme.colorSecondary.get() ?? '#999'
  const activeBorderColor = theme.primary.get() ?? '#000'

  const rightNodes = rightNode
    ? tabNames.map((name, i) => ({ index: i, node: rightNode(name) })).filter(({ node }) => node != null)
    : []

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
        {tabNames.map((name, i) => (
          <TabItem
            key={name}
            name={name}
            index={i}
            indexDecimal={indexDecimal}
            onPress={onTabPress}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            activeBorderColor={activeBorderColor}
          />
        ))}
      </View>
      {rightNodes.length > 0 && (
        <View paddingBottom="$2">
          {rightNodes.map(({ index: tabIndex, node }) => (
            <RightNodeItem key={tabIndex} index={tabIndex} indexDecimal={indexDecimal}>
              {node}
            </RightNodeItem>
          ))}
        </View>
      )}
    </View>
  )
}

const tabItemStyle = {
  paddingBottom: 8,
  borderBottomWidth: 2,
}

const tabItemTextStyle = {
  fontSize: 18,
  fontWeight: '700' as const,
  fontFamily: 'DMSans-Bold',
}
