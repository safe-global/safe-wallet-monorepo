import { SafeTab } from '@/src/components/SafeTab'
import React from 'react'
import { TxHistoryContainer } from '@/src/features/TxHistory'
import { ComingSoon } from '@/src/components/ComingSoon/ComingSoon'
import { useNavigation } from 'expo-router'
import TransactionHeader from '@/src/features/TxHistory/components/TransactionHeader'

const tabItems = [
  {
    label: 'History',
    title: 'Transactions',
    Component: TxHistoryContainer,
  },
  {
    label: `Messages`,
    title: 'Messages',
    Component: ComingSoon,
  },
]

export default function TransactionScreen() {
  const navigation = useNavigation()

  const onIndexChange = (index: number) => {
    navigation.setOptions({
      headerTitle: () => <TransactionHeader title={tabItems[index].title} />,
    })
  }
  return <SafeTab items={tabItems} containerStyle={{ marginTop: 16 }} onIndexChange={onIndexChange} />
}
