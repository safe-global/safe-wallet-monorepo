import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, Stack, YStack } from 'tamagui'
import { router, useLocalSearchParams, useGlobalSearchParams } from 'expo-router'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import { Loader } from '@/src/components/Loader'
import { SafeButton } from '@/src/components/SafeButton'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { parseFeeParams } from '@/src/utils/feeParams'
import { ReviewAndConfirmView } from '@/src/features/ConfirmTx/components/ReviewAndConfirm/ReviewAndConfirmView'
import { LargeHeaderTitle } from '@/src/components/Title'
import { getErrorMessage } from '@/src/features/ExecuteTx/components/ReviewAndExecute/helpers'
import { useTransactionExecution } from '@/src/features/ExecuteTx/hooks/useTransactionExecution'
import { useIsMounted } from '@/src/hooks/useIsMounted'

export const LedgerReviewExecuteContainer = () => {
  const { bottom } = useSafeAreaInsets()
  const { txId, sessionId } = useLocalSearchParams<{ txId: string; sessionId: string }>()
  const globalParams = useGlobalSearchParams<{
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
    gasLimit?: string
    nonce?: string
  }>()
  const activeSafe = useDefinedActiveSafe()
  const activeSigner = useAppSelector((s) => selectActiveSigner(s, activeSafe.address))
  const { data: txDetails, isLoading } = useTransactionData(txId || '')
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const feeParams = useMemo(() => parseFeeParams(globalParams), [globalParams])
  const isMounted = useIsMounted()

  const { execute } = useTransactionExecution({
    txId: txId || '',
    executionMethod: ExecutionMethod.WITH_LEDGER,
    signerAddress: activeSigner?.value || '',
    feeParams,
  })

  useEffect(() => {
    if (!sessionId) {
      setError('No Ledger session. Please reconnect.')
    }
  }, [sessionId])

  const handleExecute = useCallback(async () => {
    if (isExecuting) {
      return
    }

    try {
      setIsExecuting(true)
      setError(null)

      await execute()

      if (isMounted()) {
        router.replace({
          pathname: '/execution-success',
          params: { txId },
        })
      }
    } catch (err) {
      if (isMounted()) {
        setIsExecuting(false)
        router.push({
          pathname: '/execution-error',
          params: { description: getErrorMessage(err) },
        })
      }
    }
  }, [isExecuting, execute, txId, isMounted])

  if (isLoading || !txDetails) {
    return (
      <View flex={1} alignItems="center" justifyContent="center">
        <Loader />
      </View>
    )
  }

  return (
    <ReviewAndConfirmView
      txDetails={txDetails}
      header={
        <YStack space="$4" paddingTop="$4">
          <LargeHeaderTitle>Review and execute on your device</LargeHeaderTitle>
        </YStack>
      }
    >
      <Stack
        backgroundColor="$background"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderTopWidth={1}
        borderTopColor="$borderLight"
        space="$3"
        paddingBottom={bottom || '$4'}
      >
        {error && (
          <Text color="$error" textAlign="center">
            {error}
          </Text>
        )}
        <SafeButton onPress={handleExecute} loading={isExecuting} disabled={isExecuting || !sessionId}>
          {isExecuting ? 'Execute on Ledger...' : 'Continue on Ledger'}
        </SafeButton>
      </Stack>
    </ReviewAndConfirmView>
  )
}
