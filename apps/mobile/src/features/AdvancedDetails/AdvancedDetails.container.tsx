import React from 'react'
import { ScrollView, View } from 'tamagui'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { Alert } from '@/src/components/Alert'

import { LoadingTx } from '../ConfirmTx/components/LoadingTx'
import { TxParametersList } from './components/TxParametersList'
import { useLocalSearchParams } from 'expo-router'

export function AdvancedDetailsContainer() {
  const activeSafe = useDefinedActiveSafe()
  const { txId } = useLocalSearchParams<{ txId: string }>()

  const { data, isFetching, isError } = useTransactionsGetTransactionByIdV1Query({
    chainId: activeSafe.chainId,
    id: txId,
  })

  if (isError) {
    return (
      <View margin="$4">
        <Alert type="error" message="Error fetching transaction parameters" />
      </View>
    )
  }

  return (
    <ScrollView marginTop="$4">
      {isFetching || !data ? <LoadingTx /> : <TxParametersList txDetails={data} />}
    </ScrollView>
  )
}
