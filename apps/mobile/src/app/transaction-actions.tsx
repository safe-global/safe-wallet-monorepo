import React from 'react'

import { SafeAreaView } from 'react-native-safe-area-context'

import { TransactionActionsContainer } from '@/src/features/TransactionActions'

function TransactionActions() {
  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <TransactionActionsContainer />
    </SafeAreaView>
  )
}

export default TransactionActions
