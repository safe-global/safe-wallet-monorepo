import React, { useMemo } from 'react'
import { View, ScrollView } from 'tamagui'
import { ListTable } from '@/src/features/ConfirmTx/components/ListTable'
import { useLocalSearchParams } from 'expo-router'
import { Alert } from '@/src/components/Alert'
import { LoadingTx } from '../ConfirmTx/components/LoadingTx'
import { formatParameters } from './utils/formatParameters'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'

export function TxParametersContainer() {
  const { txId } = useLocalSearchParams<{ txId: string }>()

  const { data: txDetails, isFetching, isError } = useTransactionData(txId)

  const parameters = useMemo(() => formatParameters({ txData: txDetails?.txData }), [txDetails?.txData])

  if (isError) {
    return (
      <View margin="$4">
        <Alert type="error" message="Error fetching transaction details" />
      </View>
    )
  }

  return (
    <ScrollView marginTop="$2">
      {isFetching || !txDetails ? <LoadingTx /> : <ListTable items={parameters} />}
    </ScrollView>
  )
}
