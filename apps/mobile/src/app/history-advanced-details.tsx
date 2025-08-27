import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HistoryAdvancedDetailsContainer } from '@/src/features/HistoryAdvancedDetails'
import { getTokenValue, View } from 'tamagui'

function HistoryAdvancedDetailsPage() {
  const insets = useSafeAreaInsets()

  return (
    <View flex={1} paddingBottom={Math.max(insets.bottom, getTokenValue('$4'))}>
      <HistoryAdvancedDetailsContainer />
    </View>
  )
}

export default HistoryAdvancedDetailsPage
