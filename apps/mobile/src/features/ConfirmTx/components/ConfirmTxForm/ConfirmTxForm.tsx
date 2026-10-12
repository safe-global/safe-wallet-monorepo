import { SignForm } from '../SignForm'
import React from 'react'
import { ExecuteForm } from '../ExecuteForm'
import { AlreadySigned } from '../confirmation-views/AlreadySigned'
import { CanNotSign } from '../CanNotSign'
import { useTransactionSigner } from '../../hooks/useTransactionSigner'
import { CanNotExecute } from '@/src/features/ExecuteTx/components/CanNotExecute'
import { PendingTx } from '@/src/features/ConfirmTx/components/PendingTx'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { useSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { Loader } from '@/src/components/Loader'
import { Text, XStack, useTheme } from 'tamagui'

interface ConfirmTxFormProps {
  hasEnoughConfirmations: boolean
  isExpired: boolean
  isPending: boolean
  txId: string
  highlightedSeverity?: Severity
  riskAcknowledged: boolean
  onRiskAcknowledgedChange: (acknowledged: boolean) => void
}

const SafeSDKLoading = () => {
  const theme = useTheme()

  return (
    <XStack gap="$2" padding="$8" alignItems="center" justifyContent="center">
      <Loader size={24} thickness={2} color={String(theme.primary.get())} />
      <Text color="$colorSecondary">Initializing Safe SDK...</Text>
    </XStack>
  )
}

export function ConfirmTxForm({
  hasEnoughConfirmations,
  isExpired,
  isPending,
  txId,
  highlightedSeverity,
  riskAcknowledged,
  onRiskAcknowledgedChange,
}: ConfirmTxFormProps) {
  const { signerState } = useTransactionSigner(txId)
  const safeSDK = useSafeSDK()
  const { activeSigner, hasSigned, canSign } = signerState
  const showRiskCheckbox = highlightedSeverity === Severity.CRITICAL

  if (isPending) {
    return <PendingTx />
  }

  if (!activeSigner) {
    return <CanNotExecute />
  }

  if (hasEnoughConfirmations) {
    if (!safeSDK) {
      return <SafeSDKLoading />
    }

    return (
      <ExecuteForm
        txId={txId}
        riskAcknowledged={riskAcknowledged}
        onRiskAcknowledgedChange={onRiskAcknowledgedChange}
        showRiskCheckbox={showRiskCheckbox}
      />
    )
  }

  if (hasSigned) {
    return <AlreadySigned />
  }

  if (!canSign) {
    return <CanNotSign />
  }

  if (activeSigner && !isExpired) {
    if (!safeSDK) {
      return <SafeSDKLoading />
    }

    return (
      <SignForm
        txId={txId}
        showRiskCheckbox={showRiskCheckbox}
        riskAcknowledged={riskAcknowledged}
        onRiskAcknowledgedChange={onRiskAcknowledgedChange}
      />
    )
  }

  return null
}
