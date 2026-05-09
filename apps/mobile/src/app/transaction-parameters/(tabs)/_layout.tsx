import React from 'react'
import TransactionParameters from '@/src/app/transaction-parameters/(tabs)/parameters'
import TransactionData from '@/src/app/transaction-parameters/(tabs)/index'
import { SafeTab } from '@/src/components/SafeTab'

const tabItems = [
  {
    label: 'Data',
    Component: TransactionData,
  },
  {
    label: `Parameters`,
    Component: TransactionParameters,
  },
]

export default function TransactionsLayout() {
  return <SafeTab items={tabItems} containerStyle={{ marginTop: 16 }} />
}
