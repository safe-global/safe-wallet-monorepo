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
import { EXECUTION_FEE_INFO, gasFeeInfo } from '@/src/features/ConfirmTx/components/TransactionInfo/feeInfoText'
import { buildFeesBreakdown } from '@/src/features/ConfirmTx/components/TransactionInfo/feeRows'
import { TokenAmount } from '@/src/components/TokenAmount'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChainCurrency } from '@/src/store/chains'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface ReviewExecuteFooterProps {
  txId: string
  activeSigner: Signer | undefined
  executionMethod: ExecutionMethod
  isSafePays: boolean
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
  isSafePays,
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
  const nativeCurrency = useAppSelector(selectActiveChainCurrency)

  const isButtonDisabled = !hasSufficientFunds || isExecuting
  const buttonText = isExecuting ? 'Executing...' : getSubmitButtonText(hasSufficientFunds)

  const signerAddress = (activeSigner?.value ?? '') as Address
  const wcSignerAddress = executionMethod === ExecutionMethod.WITH_WC ? signerAddress : ''

  // Safe-pays: the fee is the deterministic max gas fee in the Safe's gas token, shown like the
  // sign-screen breakdown. Non-Safe-pays keeps the estimated network fee row.
  const safePaysGasFee =
    isSafePays && detailedExecutionInfo && nativeCurrency
      ? buildFeesBreakdown({
          detailedExecutionInfo,
          nativeCurrency: { address: ZERO_ADDRESS, symbol: nativeCurrency.symbol, decimals: nativeCurrency.decimals },
        })
      : undefined

  return (
    <View paddingHorizontal="$4" gap="$3" paddingBottom={insets.bottom ? insets.bottom : '$4'}>
      <Container
        backgroundColor="transparent"
        gap={'$2'}
        borderWidth={1}
        paddingVertical={'$3'}
        borderColor="$borderLight"
      >
        <SelectExecutor executionMethod={executionMethod} address={signerAddress} txId={txId} isSafePays={isSafePays} />

        <View flexDirection="row" justifyContent="space-between" gap="$2" alignItems="center">
          <FeeLabelWithInfo label="Execution fee" title="Execution fee" info={EXECUTION_FEE_INFO} />
          <Text fontWeight={700} color="$success">
            FREE
          </Text>
        </View>

        {safePaysGasFee ? (
          <View flexDirection="row" justifyContent="space-between" gap="$2" alignItems="center">
            <FeeLabelWithInfo label="Max gas fee" title="Gas fee" info={gasFeeInfo(true)} />
            <TokenAmount
              value={safePaysGasFee.maxGasFee.amount}
              decimals={safePaysGasFee.maxGasFee.decimals}
              tokenSymbol={safePaysGasFee.maxGasFee.symbol}
              textProps={{ fontSize: '$4', fontWeight: 700 }}
            />
          </View>
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
