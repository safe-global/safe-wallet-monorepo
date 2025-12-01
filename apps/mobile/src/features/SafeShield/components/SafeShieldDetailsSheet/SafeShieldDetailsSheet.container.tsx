import React, { useMemo } from 'react'
import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import { useLocalSearchParams } from 'expo-router'
import { AnalysisDetails } from '../AnalysisDetails'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import {
  useTransactionsGetTransactionByIdV1Query,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import useSafeTx from '@/src/hooks/useSafeTx'
import { Image, Text, View } from 'tamagui'

export const SafeShieldDetailsSheetContainer = () => {
  const { recipient, contract, threat, txId } = useLocalSearchParams<{
    recipient?: string
    contract?: string
    threat?: string
    txId?: string
  }>()

  const activeSafe = useDefinedActiveSafe()

  const { data: txDetails } = useTransactionsGetTransactionByIdV1Query(
    {
      chainId: activeSafe.chainId,
      id: txId || '',
    },
    {
      skip: !txId,
    },
  )

  const safeTx = useSafeTx(txDetails || ({} as TransactionDetails))

  const recipientData = useMemo<AsyncResult<RecipientAnalysisResults> | undefined>(() => {
    return JSON.parse(recipient || '{}') as AsyncResult<RecipientAnalysisResults>
  }, [recipient])

  const contractData = useMemo<AsyncResult<ContractAnalysisResults> | undefined>(() => {
    return JSON.parse(contract || '{}') as AsyncResult<ContractAnalysisResults>
  }, [contract])

  const threatData = useMemo<AsyncResult<ThreatAnalysisResults> | undefined>(() => {
    return JSON.parse(threat || '{}') as AsyncResult<ThreatAnalysisResults>
  }, [threat])

  return (
    <SafeBottomSheet snapPoints={['100%']} loading={false}>
      <AnalysisDetails
        recipient={recipientData}
        contract={contractData}
        threat={threatData}
        safeTx={safeTx}
        txId={txId}
      />

      <View flexDirection="row" width="100%" gap="$1" justifyContent="center" alignItems="center">
        <Text fontSize="$2" color="$textSecondary">
          Secured by
        </Text>

        <Image source={require('@/assets/images/safe-shield-logo.png')} width={77} objectFit="contain" />
      </View>
    </SafeBottomSheet>
  )
}
