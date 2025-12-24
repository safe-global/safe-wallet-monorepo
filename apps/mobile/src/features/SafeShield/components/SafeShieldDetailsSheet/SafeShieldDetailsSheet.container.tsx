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
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import useSafeTx from '@/src/hooks/useSafeTx'
import { Image, Text, View } from 'tamagui'
import { ToastViewport } from '@tamagui/toast'
import { Platform } from 'react-native'

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

  const safeTx = useSafeTx(txDetails)

  const recipientData = useMemo<AsyncResult<RecipientAnalysisResults> | undefined>(() => {
    return recipient ? JSON.parse(recipient) : undefined
  }, [recipient])

  const contractData = useMemo<AsyncResult<ContractAnalysisResults> | undefined>(() => {
    return contract ? JSON.parse(contract) : undefined
  }, [contract])

  const threatData = useMemo<AsyncResult<ThreatAnalysisResults> | undefined>(() => {
    return threat ? JSON.parse(threat) : undefined
  }, [threat])

  return (
    <SafeBottomSheet snapPoints={[]} loading={false}>
      {Platform.OS === 'ios' && <ToastViewport multipleToasts={false} left={0} right={0} />}

      <AnalysisDetails recipient={recipientData} contract={contractData} threat={threatData} safeTx={safeTx} />

      <View flexDirection="row" width="100%" gap="$1" marginTop={-4} justifyContent="center" alignItems="center">
        <Text fontSize="$2" color="$colorSecondary">
          Secured by
        </Text>

        <Image source={require('@/assets/images/safe-shield-logo.png')} width={77} objectFit="contain" />
      </View>
    </SafeBottomSheet>
  )
}
