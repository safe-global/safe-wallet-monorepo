import React from 'react'
import { Stack } from 'tamagui'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeButton } from '@/src/components/SafeButton'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import { useGuard } from '@/src/context/GuardProvider'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTransactionSigner } from '@/src/features/ConfirmTx/hooks/useTransactionSigner'
import { Address } from '@/src/types/address'
import { SelectExecutor } from '@/src/components/SelectExecutor'
import { EstimatedNetworkFee } from '../EstimatedNetworkFee'
import { Container } from '@/src/components/Container'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useGasFee from '../../hooks/useGasFee'
import { useAppSelector } from '@/src/store/hooks'
import { selectEstimatedFee } from '@/src/store/estimatedFeeSlice'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { useExecutionFunds } from '../../hooks/useExecutionFunds'
import { selectActiveChain } from '@/src/store/chains'
import { Skeleton } from 'moti/skeleton'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { getExecutionMethod, getSubmitButtonText } from './helpers'

interface ReviewFooterProps {
  txId: string
  txDetails: TransactionDetails
  relaysRemaining?: RelaysRemaining
}

export function ReviewExecuteFooter({ txId, txDetails, relaysRemaining }: ReviewFooterProps) {
  const manualParams = useAppSelector(selectEstimatedFee)
  const { signerState } = useTransactionSigner(txId)
  const { activeSigner } = signerState
  const { isBiometricsEnabled } = useBiometrics()
  const { setGuard } = useGuard()
  const insets = useSafeAreaInsets()
  const { totalFee, estimatedFeeParams, totalFeeRaw } = useGasFee(txDetails, manualParams)
  const isLoadingFees = estimatedFeeParams.isLoadingGasPrice || estimatedFeeParams.gasLimitLoading
  const { colorScheme } = useTheme()
  const chain = useAppSelector(selectActiveChain)

  // checks the executionMethod
  const isRelayAvailable = Boolean(relaysRemaining?.remaining && relaysRemaining.remaining > 0)
  const { executionMethod: executionMethodParam } = useLocalSearchParams<{ executionMethod: ExecutionMethod }>()
  const executionMethod = chain
    ? getExecutionMethod(executionMethodParam, isRelayAvailable, chain)
    : ExecutionMethod.WITH_PK

  // Check if signer has sufficient funds
  const { hasSufficientFunds, isCheckingFunds } = useExecutionFunds({
    signerAddress: activeSigner?.value,
    totalFeeRaw,
    executionMethod,
    chain: chain ?? undefined,
  })

  const handleConfirmPress = async () => {
    try {
      setGuard('executing', true)

      const params = {
        txId,
        executionMethod,
        maxFeePerGas: estimatedFeeParams.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: estimatedFeeParams.maxPriorityFeePerGas?.toString(),
        gasLimit: estimatedFeeParams.gasLimit?.toString(),
        nonce: estimatedFeeParams.nonce?.toString(),
      }

      if (executionMethod === ExecutionMethod.WITH_RELAY) {
        router.push({
          pathname: '/execute-transaction',
          params,
        })
        return
      }

      // If active signer is a Ledger device, start the Ledger-specific execution flow
      if (activeSigner?.type === 'ledger') {
        router.push({
          pathname: '/execute-transaction/ledger-connect',
          params,
        })
        return
      }

      if (isBiometricsEnabled) {
        router.push({
          pathname: '/execute-transaction',
          params,
        })
      } else {
        router.push({
          pathname: '/biometrics-opt-in',
          params: { ...params, caller: '/execute-transaction' },
        })
      }
    } catch (error) {
      console.error('Error executing transaction:', error)
    }
  }

  const willFail = Boolean(estimatedFeeParams.gasLimitError)
  const isButtonDisabled = !hasSufficientFunds
  const buttonText = getSubmitButtonText(hasSufficientFunds)
  const isLoading = isCheckingFunds || isLoadingFees

  return (
    <Stack paddingHorizontal="$4" space="$3" paddingBottom={insets.bottom ? insets.bottom : '$4'}>
      <Container
        backgroundColor="transparent"
        gap={'$2'}
        borderWidth={1}
        paddingVertical={'$3'}
        borderColor="$borderLight"
      >
        <SelectExecutor executionMethod={executionMethod} address={activeSigner?.value as Address} txId={txId} />

        <EstimatedNetworkFee
          executionMethod={executionMethod}
          isLoadingFees={isLoadingFees}
          txId={txId}
          willFail={willFail}
          totalFee={totalFee}
        />
      </Container>

      {isLoading ? (
        <Skeleton.Group show>
          <Skeleton colorMode={colorScheme} height={44} width="100%" radius={12} />
        </Skeleton.Group>
      ) : (
        <SafeButton onPress={handleConfirmPress} width="100%" disabled={isButtonDisabled}>
          {buttonText}
        </SafeButton>
      )}
    </Stack>
  )
}
