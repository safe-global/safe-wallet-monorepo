import React from 'react'

import { SafeAreaView } from 'react-native-safe-area-context'

import { TxParametersContainer } from '@/src/features/AdvancedDetails'

function TransactionParameters() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <TxParametersContainer />
    </SafeAreaView>
  )
}

export default TransactionParameters
