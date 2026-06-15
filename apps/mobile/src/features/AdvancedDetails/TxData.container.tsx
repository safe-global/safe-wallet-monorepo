import React, { useMemo } from 'react'
import { View, ScrollView } from 'tamagui'
import { ListTable } from '@/src/features/ConfirmTx/components/ListTable'
import { useLocalSearchParams } from 'expo-router'
import { Alert } from '@/src/components/Alert'
import { LoadingTx } from '../ConfirmTx/components/LoadingTx'
import { formatTxDetails } from './utils/formatTxDetails'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'

export function TxDataContainer() {
  const { txId } = useLocalSearchParams<{ txId: string }>()

  const { data: txDetails, isLoading, isError } = useTransactionData(txId)

  const viewOnExplorer = useOpenExplorer(txDetails?.txData?.to.value || '')

  const parameters = useMemo(() => formatTxDetails({ txDetails, viewOnExplorer }), [txDetails, viewOnExplorer])

  if (isError && !txDetails) {
    return (
      <View margin="$4">
        <Alert type="error" message="Error fetching transaction details" />
      </View>
    )
  }

  return (
    <ScrollView marginTop="$2">{isLoading || !txDetails ? <LoadingTx /> : <ListTable items={parameters} />}</ScrollView>
  )
}
