import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HistoryTransactionDetailsContainer } from '@/src/features/HistoryTransactionDetails'
import { getTokenValue, View } from 'tamagui'

function HistoryTransactionDetailsPage() {
  const insets = useSafeAreaInsets()

  return (
    <View flex={1} paddingBottom={Math.max(insets.bottom, getTokenValue('$4'))}>
      <HistoryTransactionDetailsContainer />
    </View>
  )
}

export default HistoryTransactionDetailsPage
