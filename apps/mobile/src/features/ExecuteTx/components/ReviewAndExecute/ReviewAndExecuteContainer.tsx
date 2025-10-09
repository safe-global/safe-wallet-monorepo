import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { Loader } from '@/src/components/Loader'
import { Text, View } from 'tamagui'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import { ReviewAndConfirmView } from '@/src/features/ConfirmTx/components/ReviewAndConfirm'
import { ReviewExecuteFooter } from '@/src/features/ExecuteTx/components/ReviewAndExecute/ReviewExecuteFooter'
import { ReviewExecuteFooterSkeleton } from '@/src/features/ExecuteTx/components/ReviewAndExecute/ReviewExecuteFooterSkeleton'
import { useClearEstimatedFeeOnMount } from '@/src/features/ExecuteTx/hooks/useClearEstimatedFeeOnMount'
import { useRelayGetRelaysRemainingV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

export function ReviewAndExecuteContainer() {
  const { txId } = useLocalSearchParams<{ txId: string }>()

  const { data: txDetails, isFetching: isLoading, isError } = useTransactionData(txId || '')

  const activeSafe = useDefinedActiveSafe()

  // Check relay availability
  const { data: relaysRemaining, isLoading: isLoadingRelays } = useRelayGetRelaysRemainingV1Query({
    chainId: activeSafe.chainId,
    safeAddress: activeSafe.address,
  })
  // Clear estimated fee values when screen is mounted
  useClearEstimatedFeeOnMount()

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
      {isLoadingRelays ? (
        <ReviewExecuteFooterSkeleton />
      ) : (
        <ReviewExecuteFooter txDetails={txDetails} txId={txId} relaysRemaining={relaysRemaining} />
      )}
    </ReviewAndConfirmView>
  )
}
