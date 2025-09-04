import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { Loader } from '@/src/components/Loader'
import { Text, View } from 'tamagui'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import { ReviewAndConfirmView } from '@/src/features/ConfirmTx/components/ReviewAndConfirm'
import { ReviewExecuteFooter } from '@/src/features/ExecuteTx/components/ReviewAndExecute/ReviewExecuteFooter'

export function ReviewAndExecuteContainer() {
  const { txId } = useLocalSearchParams<{ txId: string }>()

  const { data: txDetails, isFetching: isLoading, isError } = useTransactionData(txId || '')

  if (!txId) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Text>Missing transaction ID</Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Loader />
      </View>
    )
  }

  if (isError || !txDetails) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Text>Error loading transaction details</Text>
      </View>
    )
  }

  return (
    <ReviewAndConfirmView txDetails={txDetails}>
      <ReviewExecuteFooter txId={txId} />
    </ReviewAndConfirmView>
  )
}
