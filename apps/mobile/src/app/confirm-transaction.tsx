import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ConfirmTxContainer } from '@/src/features/ConfirmTx'

function ConfirmTransactionPage() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <ConfirmTxContainer />
    </SafeAreaView>
  )
}

export default ConfirmTransactionPage
