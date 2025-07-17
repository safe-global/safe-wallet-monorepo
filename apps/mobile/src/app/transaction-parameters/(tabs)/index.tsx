import React from 'react'

import { SafeAreaView } from 'react-native-safe-area-context'

import { TxDataContainer } from '@/src/features/AdvancedDetails'

function TransactionParameters() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, paddingHorizontal: 16 }}>
      <TxDataContainer />
    </SafeAreaView>
  )
}

export default TransactionParameters
