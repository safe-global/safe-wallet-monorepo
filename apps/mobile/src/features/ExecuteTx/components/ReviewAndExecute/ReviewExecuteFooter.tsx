import React from 'react'
import { View, Text } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Address } from '@/src/types/address'
import { SelectExecutor } from '@/src/components/SelectExecutor'
import { EstimatedNetworkFee } from '../EstimatedNetworkFee'
import { Container } from '@/src/components/Container'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { SafeSkeleton } from '@/src/components/SafeSkeleton'
import { getSubmitButtonText } from './helpers'
import { Alert } from '@/src/components/Alert'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Signer } from '@/src/store/signersSlice'
import { WalletConnectGate } from '@/src/features/WalletConnect/Signer/components/WalletConnectGate'
import { FeeLabelWithInfo } from '@/src/features/ConfirmTx/components/TransactionInfo/FeeLabelWithInfo'
import { FeeRow, FeeAmount, FeeFreeValue } from '@/src/features/ConfirmTx/components/TransactionInfo/FeeRow'
import { GAS_FEE_INFO, GAS_FEE_HELP_LINK } from '@/src/features/ConfirmTx/components/TransactionInfo/feeInfoText'
import { useFeesBreakdown } from '@/src/features/ConfirmTx/components/TransactionInfo/useFeesBreakdown'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
import type { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface ReviewExecuteFooterProps {
  txId: string
  activeSigner: Signer | undefined
  executionMethod: ExecutionMethod
  isPaidFromSafe: boolean
  isGtfEnabled: boolean
  detailedExecutionInfo?: MultisigExecutionDetails
  totalFee: string
  isLoadingFees: boolean
  willFail: boolean
  hasSufficientFunds: boolean
  isCheckingFunds: boolean
  isExecuting: boolean
  onConfirmPress: () => void
}

/**
 * Presentational component for the execution footer.
 * Receives all display data as props - no business logic hooks.
 */
export function ReviewExecuteFooter({
  txId,
  activeSigner,
  executionMethod,
  isPaidFromSafe,
  isGtfEnabled,
  detailedExecutionInfo,
  totalFee,
  isLoadingFees,
  willFail,
  hasSufficientFunds,
  isCheckingFunds,
  isExecuting,
  onConfirmPress,
}: ReviewExecuteFooterProps) {
  const insets = useSafeAreaInsets()
  const currency = useAppSelector(selectCurrency)

  const isButtonDisabled = !hasSufficientFunds || isExecuting
  const buttonText = isExecuting ? 'Executing...' : getSubmitButtonText(hasSufficientFunds)

  const signerAddress = (activeSigner?.value ?? '') as Address
  const wcSignerAddress = executionMethod === ExecutionMethod.WITH_WC ? signerAddress : ''

  // Safe-pays: the fee is the deterministic max gas fee in the Safe's gas token, shown like the
  // sign-screen breakdown. Non-Safe-pays keeps the estimated network fee row.
  const breakdown = useFeesBreakdown({ detailedExecutionInfo })
  const paidFromSafeGasFee = isPaidFromSafe ? breakdown : undefined

  return (
    <View paddingHorizontal="$4" gap="$3" paddingBottom={insets.bottom ? insets.bottom : '$4'}>
      <Container
        backgroundColor="transparent"
        gap={'$1'}
        borderWidth={1}
        paddingVertical={'$3'}
        borderColor="$borderLight"
      >
        <SelectExecutor
          executionMethod={executionMethod}
          address={signerAddress}
          txId={txId}
          isPaidFromSafe={isPaidFromSafe}
        />

        {isGtfEnabled && (
          <FeeRow
            label={
              <Text color="$textSecondaryLight" fontSize="$4">
                Execution Fee
              </Text>
            }
          >
            <FeeFreeValue />
          </FeeRow>
        )}

        {paidFromSafeGasFee ? (
          <FeeRow
            label={
              <FeeLabelWithInfo label="Max gas fee" title="Max gas fee" info={GAS_FEE_INFO} link={GAS_FEE_HELP_LINK} />
            }
          >
            <FeeAmount
              line={paidFromSafeGasFee.maxGasFee}
              fiat={paidFromSafeGasFee.maxGasFeeFiat}
              currency={currency}
            />
          </FeeRow>
        ) : (
          <EstimatedNetworkFee
            executionMethod={executionMethod}
            isLoadingFees={isLoadingFees}
            txId={txId}
            willFail={willFail}
            totalFee={totalFee}
          />
        )}

        {willFail && (
          <Alert
            gap="$1"
            startIcon={<SafeFontIcon name="alert-triangle" color="$error" size={20} />}
            type="error"
            message={<Text>This transaction will most likely fail</Text>}
          />
        )}
      </Container>

      {isCheckingFunds ? (
        <SafeSkeleton.Group show>
          <SafeSkeleton height={44} width="100%" radius={12} />
        </SafeSkeleton.Group>
      ) : (
        <WalletConnectGate signerAddress={wcSignerAddress}>
          <SafeButton onPress={onConfirmPress} width="100%" disabled={isButtonDisabled} loading={isExecuting}>
            {buttonText}
          </SafeButton>
        </WalletConnectGate>
      )}
    </View>
  )
}
