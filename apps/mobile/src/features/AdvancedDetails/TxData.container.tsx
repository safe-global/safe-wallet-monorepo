import React, { useMemo } from 'react'
import { View, ScrollView } from 'tamagui'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ListTable } from '@/src/features/ConfirmTx/components/ListTable'
import { useLocalSearchParams } from 'expo-router'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { Alert } from '@/src/components/Alert'
import { LoadingTx } from '../ConfirmTx/components/LoadingTx'
import { formatTxDetails } from './utils/formatTxDetails'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'

export function TxDataContainer() {
  const activeSafe = useDefinedActiveSafe()
  const { txId } = useLocalSearchParams<{ txId: string }>()

  const {
    data: txDetails,
    isFetching,
    isError,
  } = useTransactionsGetTransactionByIdV1Query({
    chainId: activeSafe.chainId,
    id: txId,
  })

  const viewOnExplorer = useOpenExplorer(txDetails?.txData?.to.value || '')

  const parameters = useMemo(() => formatTxDetails({ txDetails, viewOnExplorer }), [txDetails, viewOnExplorer])

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
