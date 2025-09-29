import React from 'react'
import { HistoryTransactionDetailsContainer } from '@/src/features/HistoryTransactionDetails'
import { View } from 'tamagui'

function HistoryTransactionDetailsPage() {
  return (
    <View flex={1}>
      <HistoryTransactionDetailsContainer />
    </View>
  )
}

export default HistoryTransactionDetailsPage
