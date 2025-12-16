import React, { ReactElement, useState } from 'react'
import { TabBarProps, Tabs } from 'react-native-collapsible-tab-view'
import { safeTabItem } from './types'
import { SafeTabBar } from './SafeTabBar'
import { Theme } from 'tamagui'
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

export function SafeTab<T extends object>({
  renderHeader,
  headerHeight,
  items,
  containerProps,
  containerStyle,
  onIndexChange,
  rightNode,
}: SafeTabProps<T>) {
  const [activeTab, setActiveTab] = useState(items[0].label)

  return (
    <Theme name={'tab'}>
      <Tabs.Container
        containerStyle={containerStyle}
        renderHeader={renderHeader}
        headerContainerStyle={headerContainerStyle}
        headerHeight={headerHeight}
        renderTabBar={(props) => (
          <SafeTabBar activeTab={activeTab} setActiveTab={setActiveTab} rightNode={rightNode?.(activeTab)} {...props} />
        )}
        onTabChange={(event) => setActiveTab(event.tabName)}
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
    </Theme>
  )
}

const headerContainerStyle = { backgroundColor: '$background', shadowColor: 'transparent' }

SafeTab.FlashList = Tabs.FlashList
SafeTab.FlatList = Tabs.FlatList
SafeTab.ScrollView = Tabs.ScrollView
