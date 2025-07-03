import React from 'react'
import { Alert } from '@/src/components/Alert'
import { getAlertType, shouldShowBottomContent, SecurityState } from '../utils/transactionChecksUtils'

interface TransactionChecksBottomContentProps {
  security: SecurityState
}

export const TransactionChecksBottomContent = ({ security }: TransactionChecksBottomContentProps) => {
  if (!shouldShowBottomContent(security)) {
    return null
  }

  // Show warnings for security issues (malicious/warning)
  if (security.hasIssues) {
    return (
      <Alert type={getAlertType(security)} info="Potential risk detected" message="Review details before signing" />
    )
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
