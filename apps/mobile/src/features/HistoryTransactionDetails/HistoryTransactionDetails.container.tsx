import React from 'react'
import { getTokenValue, ScrollView, View } from 'tamagui'
import { Stack, useLocalSearchParams } from 'expo-router'

import { LoadingTx } from '@/src/features/ConfirmTx/components/LoadingTx'
import { Alert } from '@/src/components/Alert'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { HistoryTransactionView } from '@/src/features/HistoryTransactionDetails/components/HistoryTransactionView'
import { HistoryTransactionInfo } from '@/src/features/HistoryTransactionDetails/components/HistoryTransactionInfo'
import { ViewOnExplorerButton } from '@/src/features/HistoryTransactionDetails/components/ViewOnExplorerButton'
import { ShareButton } from '@/src/components/ShareButton'
import { useShareTransaction } from '@/src/hooks/useShareTransaction'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function HistoryTransactionDetailsContainer() {
  const { txId } = useLocalSearchParams<{ txId: string }>()
  const activeSafe = useDefinedActiveSafe()
  const shareTransaction = useShareTransaction(txId)
  const { bottom } = useSafeAreaInsets()
  const {
    currentData: txDetails,
    isError,
    isLoading,
  } = useTransactionsGetTransactionByIdV1Query({
    chainId: activeSafe.chainId,
    id: txId,
  })

  if (isError) {
    return (
      <View margin="$4">
        <Alert type="error" message="Error fetching transaction details" />
      </View>
    )
  }

  if (isLoading || !txDetails) {
    return <LoadingTx />
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Transaction details',
          headerRight: () => <ShareButton onPress={shareTransaction} testID="share-transaction-button" />,
        }}
      />
      <View flex={1}>
        <ScrollView contentContainerStyle={{ paddingBottom: Math.max(bottom, getTokenValue('$4')) }}>
          <View paddingHorizontal="$4">
            <HistoryTransactionView txDetails={txDetails} />
          </View>
          <HistoryTransactionInfo txId={txId} txDetails={txDetails} />

          <View paddingTop="$1">
            <ViewOnExplorerButton txHash={txDetails.txHash} />
          </View>
        </ScrollView>
      </View>
    </>
  )
}

export default HistoryTransactionDetailsContainer
