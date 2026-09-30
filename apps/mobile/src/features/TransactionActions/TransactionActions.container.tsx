import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { ScrollView, View } from 'tamagui'

import { LargeHeaderTitle, NavBarTitle } from '@/src/components/Title'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { Alert } from '@/src/components/Alert'

import { LoadingTx } from '../ConfirmTx/components/LoadingTx'
import { TxActionsList } from './components/TxActionsList'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'

export function TransactionActionsContainer() {
  const { txId } = useLocalSearchParams<{ txId: string }>()

  const { data, isFetching, isError } = useTransactionData(txId)

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle>Actions</NavBarTitle>,
  })

  if (isError) {
    return (
      <View margin="$4">
        <Alert type="error" message="Error fetching transaction actions" />
      </View>
    )
  }

  return (
    <ScrollView onScroll={handleScroll}>
      <LargeHeaderTitle paddingHorizontal="$4">Actions</LargeHeaderTitle>

      {isFetching || !data ? <LoadingTx /> : <TxActionsList txDetails={data} />}
    </ScrollView>
  )
}
