import React from 'react'

import { SafeAreaView } from 'react-native-safe-area-context'

import { TransactionParametersContainer } from '@/src/features/TransactionParameters'

function TransactionParameters() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <TransactionParametersContainer />
    </SafeAreaView>
  )
}

export default TransactionParameters
