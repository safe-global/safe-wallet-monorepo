import React from 'react'
import { Alert } from '@/src/components/Alert'
import { getAlertType, SecurityState } from '../utils/transactionChecksUtils'
import { View } from 'tamagui'
import { InfoSheet } from '@/src/components/InfoSheet'

interface TransactionChecksBottomContentProps {
  security: SecurityState
}

export const TransactionChecksBottomContent = ({ security }: TransactionChecksBottomContentProps) => {
  // Show warnings for security issues (malicious/warning)
  if (security.hasIssues) {
    return (
      <Alert type={getAlertType(security)} info="Potential risk detected" message="Review details before signing" />
    )
  }

  // Show warnings for contract management changes (proxy upgrades, ownership changes, etc.)
  if (security.hasContractManagement) {
    return (
      <View>
        <InfoSheet title="Proceed with caution" info="Review details first">
          <Alert type="warning" message="Contract changes detected" />
        </InfoSheet>
      </View>
    )
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
