import React from 'react'

import { SafeAreaView } from 'react-native-safe-area-context'

import { ActionDetailsContainer } from '@/src/features/ActionDetails'

function ActionDetails() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <ActionDetailsContainer />
    </SafeAreaView>
  )
}

export default ActionDetails
