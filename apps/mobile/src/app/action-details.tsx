import React from 'react'

import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ActionDetailsContainer } from '@/src/features/ActionDetails'
import { View } from 'tamagui'

function ActionDetails() {
  const { bottom } = useSafeAreaInsets()
  return (
    <View flex={1} paddingBottom={bottom}>
      <ActionDetailsContainer />
    </View>
  )
}

export default ActionDetails
