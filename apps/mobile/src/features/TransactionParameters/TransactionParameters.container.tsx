import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { ScrollView, View } from 'tamagui'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { LargeHeaderTitle, NavBarTitle } from '@/src/components/Title'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { Alert } from '@/src/components/Alert'

import { LoadingTx } from '../ConfirmTx/components/LoadingTx'
import { TxParametersList } from './components/TxParametersList'

export function TransactionParametersContainer() {
  const { txId } = useLocalSearchParams<{ txId: string }>()
  const activeSafe = useDefinedActiveSafe()

  const { data, isFetching, isError } = useTransactionsGetTransactionByIdV1Query({
    chainId: activeSafe.chainId,
    id: txId,
  })

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle>Parameters</NavBarTitle>,
  })

  if (isError) {
    return (
      <View margin="$4">
        <Alert type="error" message="Error fetching transaction parameters" />
      </View>
    )
  }

  return (
    <ScrollView onScroll={handleScroll}>
      <LargeHeaderTitle paddingHorizontal="$4">Parameters</LargeHeaderTitle>

      {isFetching || !data ? <LoadingTx /> : <TxParametersList txDetails={data} />}
    </ScrollView>
  )
}
