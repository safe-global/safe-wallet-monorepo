import React from 'react'
import { Tabs } from 'react-native-collapsible-tab-view'
import { TxDataContainer } from '@/src/features/AdvancedDetails'

export function DataTab() {
  return (
    <Tabs.ScrollView contentContainerStyle={{ padding: 16 }}>
      <TxDataContainer />
    </Tabs.ScrollView>
  )
}
