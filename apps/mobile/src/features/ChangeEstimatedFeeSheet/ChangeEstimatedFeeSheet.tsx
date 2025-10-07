import React from 'react'
import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import { useLocalSearchParams } from 'expo-router'
import { useTransactionData } from '../ConfirmTx/hooks/useTransactionData'
import { ChangeEstimatedFeeForm } from './components/ChangeEstimatedFeeForm'
import { useFeeParams } from '@/src/hooks/useFeeParams/useFeeParams'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppSelector } from '@/src/store/hooks'
import { selectEstimatedFee } from '@/src/store/estimatedFeeSlice'

export const ChangeEstimatedFeeSheetContainer = () => {
  const { txId } = useLocalSearchParams<{ txId: string }>()
  const { data: txDetails, isLoading: isLoadingTxDetails } = useTransactionData(txId)
  const manualParams = useAppSelector(selectEstimatedFee)
  const estimatedFeeParams = useFeeParams(txDetails as TransactionDetails, manualParams, false)
  const isLoading = isLoadingTxDetails || estimatedFeeParams.isLoadingGasPrice || estimatedFeeParams.gasLimitLoading

  return (
    <SafeBottomSheet snapPoints={['100%']} loading={isLoading} title="Adjust network fee">
      {!isLoading && txDetails && (
        <ChangeEstimatedFeeForm estimatedFeeParams={estimatedFeeParams} txDetails={txDetails} />
      )}
    </SafeBottomSheet>
  )
}
