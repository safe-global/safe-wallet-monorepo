import React from 'react'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeListItem } from '@/src/components/SafeListItem'
import { useRouter } from 'expo-router'
import { IconName } from '@/src/types/iconTypes'
import { Alert } from '@/src/components/Alert'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { CircleSnail } from 'react-native-progress'
import { useTransactionSecurity } from './hooks/useTransactionSecurity'

interface TransactionChecksProps {
  txId: string
  txDetails?: TransactionDetails
}

export function TransactionChecks({ txId, txDetails }: TransactionChecksProps) {
  const router = useRouter()

  // Handle all security scanning internally
  const security = useTransactionSecurity(txDetails)

  const onTransactionChecksPress = () => {
    router.push({
      pathname: '/transaction-checks',
      params: { txId },
    })
  }

  const getTransactionChecksIcon = (): IconName => {
    if (security.hasError) {
      return 'shield-crossed'
    }
    if (security.isMediumRisk || security.hasContractManagement) {
      return 'alert-triangle'
    }
    return 'shield'
  }

  const getTransactionChecksLeftNode = () => {
    if (security.isScanning) {
      return <CircleSnail size={16} borderWidth={0} thickness={1} />
    }
    return <SafeFontIcon name={getTransactionChecksIcon()} />
  }

  const getTransactionChecksLabel = () => {
    if (security.isScanning) {
      return 'Checking transaction...'
    }
    return 'Transaction checks'
  }

  const getAlertType = () => {
    if (security.isHighRisk) {
      return 'error'
    }
    if (security.isMediumRisk) {
      return 'warning'
    }
    return 'info'
  }

  const getTransactionChecksBottomContent = () => {
    if (!security.enabled) {
      return null
    }

    // Show warnings for security issues (malicious/warning)
    if (security.hasIssues) {
      return <Alert type={getAlertType()} info="Potential risk detected" message="Review details before signing" />
    }

    // Show warnings for contract management changes (proxy upgrades, ownership changes, etc.)
    if (security.hasContractManagement) {
      return <Alert type="warning" info="Review details first" message="Contract changes detected!" />
    }

    // Show error if blockaid check failed
    if (security.error) {
      return (
        <Alert
          type="warning"
          message="Proceed with caution"
          info="The transaction could not be checked for security alerts. Verify the details and addresses before proceeding."
        />
      )
    }

    return null
  }

  return (
    <SafeListItem
      onPress={onTransactionChecksPress}
      leftNode={getTransactionChecksLeftNode()}
      label={getTransactionChecksLabel()}
      rightNode={<SafeFontIcon name={'chevron-right'} />}
      bottomContent={getTransactionChecksBottomContent()}
    />
  )
}
