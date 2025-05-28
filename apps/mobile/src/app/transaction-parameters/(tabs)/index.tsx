import React from 'react'

import { SafeAreaView } from 'react-native-safe-area-context'

import { AdvancedDetailsContainer } from '@/src/features/AdvancedDetails'

function TransactionParameters() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <AdvancedDetailsContainer />
    </SafeAreaView>
  )
}

export default TransactionParameters
