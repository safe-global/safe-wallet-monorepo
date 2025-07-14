import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { Loader } from '@/src/components/Loader'
import { Text, View } from 'tamagui'
import { ReviewAndConfirmView } from './ReviewAndConfirmView'
import { Address } from '@/src/types/address'

export function ReviewAndConfirmContainer() {
  const { txId, signerAddress } = useLocalSearchParams<{
    txId: string
    signerAddress: Address
  }>()

  const activeSafe = useAppSelector(selectActiveSafe)

  const {
    data: txDetails,
    isFetching: isLoading,
    isError: error,
  } = useTransactionsGetTransactionByIdV1Query(
    {
      chainId: activeSafe?.chainId || '',
      id: txId || '',
    },
    { skip: !txId || !activeSafe?.chainId },
  )

  if (isLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Loader />
      </View>
    )
  }

  if (error || !txDetails) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Text>Error loading transaction details</Text>
      </View>
    )
  }

  return <ReviewAndConfirmView txDetails={txDetails} signerAddress={signerAddress} />
}
