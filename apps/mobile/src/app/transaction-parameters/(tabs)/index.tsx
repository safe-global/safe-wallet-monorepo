import React from 'react'

import { SafeAreaView } from 'react-native-safe-area-context'

import { TxDataContainer } from '@/src/features/AdvancedDetails'

function TransactionData() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, paddingHorizontal: 16, marginTop: 40 }}>
      <TxDataContainer />
    </SafeAreaView>
  )
}

export default TransactionData
