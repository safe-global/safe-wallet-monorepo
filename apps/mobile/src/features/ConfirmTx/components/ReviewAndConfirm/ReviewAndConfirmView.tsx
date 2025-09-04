import React from 'react'
import { useTheme, View } from 'tamagui'
import { Tabs, MaterialTabBar } from 'react-native-collapsible-tab-view'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ReviewHeader } from './ReviewHeader'
import { ReviewFooter } from './ReviewFooter'
import { DataTab } from './tabs/DataTab'
import { JSONTab } from './tabs/JSONTab'
import { useTheme as useCurrentTheme } from '@/src/theme/hooks/useTheme'

interface ReviewAndConfirmViewProps {
  txDetails: TransactionDetails
  txId: string
}

export function ReviewAndConfirmView({ txDetails, txId }: ReviewAndConfirmViewProps) {
  const { isDark } = useCurrentTheme()
  const theme = useTheme()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTabBar = (props: any) => (
    <MaterialTabBar
      {...props}
      indicatorStyle={{
        backgroundColor: theme.color.get(),
      }}
      style={{ backgroundColor: isDark ? theme.background.get() : theme.backgroundPaper.get() }}
      labelStyle={{ color: theme.color.get(), fontSize: 16, fontWeight: '600' }}
      activeColor={theme.color.get()}
      inactiveColor={theme.colorSecondary.get()}
      width={200}
    />
  )

  return (
    <View flex={1}>
      <Tabs.Container
        renderTabBar={renderTabBar}
        headerContainerStyle={{
          backgroundColor: 'transparent',
          paddingHorizontal: 16,
          paddingBottom: 16,
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
        }}
        renderHeader={() => <ReviewHeader />}
      >
        <Tabs.Tab name="Data" label="Data">
          <DataTab />
        </Tabs.Tab>
        <Tabs.Tab name="JSON" label="JSON">
          <JSONTab txDetails={txDetails} />
        </Tabs.Tab>
      </Tabs.Container>

      <ReviewFooter txId={txId} />
    </View>
  )
}
