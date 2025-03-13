import React, { ReactElement, useState } from 'react'
import { TabBarProps, Tabs } from 'react-native-collapsible-tab-view'
import { safeTabItem } from './types'
import { SafeTabBar } from './SafeTabBar'
import { Theme } from 'tamagui'

interface SafeTabProps {
  renderHeader?: (props: TabBarProps<string>) => ReactElement
  headerHeight?: number
  items: safeTabItem[]
}

export function SafeTab({ renderHeader, headerHeight, items }: SafeTabProps) {
  const [activeTab, setActiveTab] = useState(items[0].label)

  return (
    <Theme name={'tab'}>
      <Tabs.Container
        renderHeader={renderHeader}
        headerContainerStyle={headerContainerStyle}
        headerHeight={headerHeight}
        renderTabBar={(props) => <SafeTabBar activeTab={activeTab} setActiveTab={setActiveTab} {...props} />}
        onTabChange={(event) => setActiveTab(event.tabName)}
        initialTabName={items[0].label}
      >
        {items.map(({ label, Component }, index) => (
          <Tabs.Tab name={label} key={`${label}-${index}`}>
            <Component />
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
