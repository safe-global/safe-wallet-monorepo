import React, { ReactElement, useMemo } from 'react'
import { TabBarProps, Tabs } from 'react-native-collapsible-tab-view'
import { safeTabItem } from './types'
import { SafeTabBar } from './SafeTabBar'
import { Theme, useTheme } from 'tamagui'
import { StyleProp, ViewStyle } from 'react-native'
import { View } from 'tamagui'

interface SafeTabProps<T> {
  renderHeader?: (props: TabBarProps<string>) => ReactElement
  headerHeight?: number
  items: safeTabItem<T>[]
  containerProps?: T
  containerStyle?: StyleProp<ViewStyle>
  onIndexChange?: (index: number) => void
  rightNode?: (activeTabLabel: string) => React.ReactNode
}

function SafeTabInner<T extends object>({
  renderHeader,
  headerHeight,
  items,
  containerProps,
  containerStyle,
  onIndexChange,
  rightNode,
}: SafeTabProps<T>) {
  const theme = useTheme()
  const headerContainerStyle = useMemo(
    () => ({ backgroundColor: theme.background.get(), shadowColor: 'transparent' }),
    [theme.background],
  )

  return (
    <Tabs.Container
      containerStyle={containerStyle}
      renderHeader={renderHeader}
      headerContainerStyle={headerContainerStyle}
      headerHeight={headerHeight}
      renderTabBar={(props) => <SafeTabBar rightNode={rightNode} {...props} />}
      onIndexChange={onIndexChange}
      initialTabName={items[0].label}
    >
      {items.map(({ label, testID, Component }, index) => (
        <Tabs.Tab name={label} key={`${label}-${index}`}>
          <View testID={testID ?? `tab-content-${label}-${index}`} flex={1}>
            <Component {...(containerProps as T)} />
          </View>
        </Tabs.Tab>
      ))}
    </Tabs.Container>
  )
}

export function SafeTab<T extends object>(props: SafeTabProps<T>) {
  return (
    <Theme name={'tab'}>
      <SafeTabInner {...props} />
    </Theme>
  )
}

SafeTab.FlashList = Tabs.FlashList
SafeTab.FlatList = Tabs.FlatList
SafeTab.ScrollView = Tabs.ScrollView
