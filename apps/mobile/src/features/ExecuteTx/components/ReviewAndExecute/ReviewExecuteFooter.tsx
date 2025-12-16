import React from 'react'
import { Stack, Text } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Address } from '@/src/types/address'
import { SelectExecutor } from '@/src/components/SelectExecutor'
import { EstimatedNetworkFee } from '../EstimatedNetworkFee'
import { Container } from '@/src/components/Container'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { Skeleton } from 'moti/skeleton'
import { useTheme } from '@/src/theme/hooks/useTheme'
import { getSubmitButtonText } from './helpers'
import { Alert } from '@/src/components/Alert'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Signer } from '@/src/store/signersSlice'

interface ReviewExecuteFooterProps {
  txId: string
  activeSigner: Signer | undefined
  executionMethod: ExecutionMethod
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
  totalFee,
  isLoadingFees,
  willFail,
  hasSufficientFunds,
  isCheckingFunds,
  isExecuting,
  onConfirmPress,
}: ReviewExecuteFooterProps) {
  const insets = useSafeAreaInsets()
  const { colorScheme } = useTheme()

  const isButtonDisabled = !hasSufficientFunds || isExecuting
  const buttonText = isExecuting ? 'Executing...' : getSubmitButtonText(hasSufficientFunds)

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
        <Skeleton.Group show>
          <Skeleton colorMode={colorScheme} height={44} width="100%" radius={12} />
        </Skeleton.Group>
      ) : (
        <SafeButton onPress={onConfirmPress} width="100%" disabled={isButtonDisabled} loading={isExecuting}>
          {buttonText}
        </SafeButton>
      )}
    </Stack>
  )
}
