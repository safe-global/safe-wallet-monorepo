import React, { ReactNode } from 'react'
import { useTheme, View } from 'tamagui'
import { Tabs, MaterialTabBar } from 'react-native-collapsible-tab-view'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ReviewHeader } from './ReviewHeader'
import { DataTab } from './tabs/DataTab'
import { JSONTab } from './tabs/JSONTab'
import { HashesTab } from './tabs/HashesTab'
import { useTheme as useCurrentTheme } from '@/src/theme/hooks/useTheme'

interface ReviewAndConfirmViewProps {
  txDetails: TransactionDetails
  children: ReactNode
  header?: ReactNode
}

export function ReviewAndConfirmView({ txDetails, children, header }: ReviewAndConfirmViewProps) {
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
      width={300}
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
        renderHeader={() => (header ? <>{header}</> : <ReviewHeader />)}
      >
        <Tabs.Tab name="Data" label="Data">
          <DataTab />
        </Tabs.Tab>
        <Tabs.Tab name="Hashes" label="Hashes">
          <HashesTab txDetails={txDetails} />
        </Tabs.Tab>
        <Tabs.Tab name="JSON" label="JSON">
          <JSONTab txDetails={txDetails} />
        </Tabs.Tab>
      </Tabs.Container>

      {children}
    </View>
  )
}
