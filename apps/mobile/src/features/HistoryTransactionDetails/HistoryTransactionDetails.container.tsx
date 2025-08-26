import React, { useEffect } from 'react'
import { ScrollView, View } from 'tamagui'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Stack } from 'expo-router'

import { LoadingTx } from '@/src/features/ConfirmTx/components/LoadingTx'
import { Alert } from '@/src/components/Alert'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { HistoryTransactionView } from '@/src/features/HistoryTransactionDetails/components/HistoryTransactionView'
import { HistoryTransactionInfo } from '@/src/features/HistoryTransactionDetails/components/HistoryTransactionInfo'
import { ViewOnExplorerButton } from '@/src/features/HistoryTransactionDetails/components/ViewOnExplorerButton'
import { getHeaderTitle } from '@/src/features/HistoryTransactionDetails/utils/header'

function HistoryTransactionDetailsContainer() {
  const txId = useRoute<RouteProp<{ params: { txId: string } }>>().params.txId
  const activeSafe = useDefinedActiveSafe()
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      title: 'Transaction details',
    })
  }, [navigation])

  const {
    data: txDetails,
    isFetching: isLoading,
    isError,
  } = useTransactionsGetTransactionByIdV1Query({
    chainId: activeSafe.chainId,
    id: txId,
  })

  if (isLoading || !txDetails) {
    return <LoadingTx />
  }

  if (isError) {
    return (
      <View margin="$4">
        <Alert type="error" message="Error fetching transaction details" />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: getHeaderTitle(txDetails) }} />
      <View flex={1}>
        <ScrollView>
          <View paddingHorizontal="$4">
            <HistoryTransactionView txDetails={txDetails} />
          </View>
          <HistoryTransactionInfo txId={txId} txDetails={txDetails} />
        </ScrollView>

        <View paddingTop="$1">
          <ViewOnExplorerButton txHash={txDetails.txHash} />
        </View>
      </View>
    </>
  )
}

export default HistoryTransactionDetailsContainer
