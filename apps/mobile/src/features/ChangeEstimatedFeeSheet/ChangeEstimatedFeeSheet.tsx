import React from 'react'
import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import { useLocalSearchParams } from 'expo-router'
import { useTransactionData } from '../ConfirmTx/hooks/useTransactionData'
import { ChangeEstimatedFeeForm } from './components/ChangeEstimatedFeeForm'

export const ChangeEstimatedFeeSheetContainer = () => {
    const { txId } = useLocalSearchParams<{ txId: string }>()
    const { data: txDetails, isFetching: isLoading } = useTransactionData(txId)


    return (
        <SafeBottomSheet loading={isLoading} title="Adjust network fee">
            {txDetails && <ChangeEstimatedFeeForm txDetails={txDetails} />}
        </SafeBottomSheet>
    )
}
