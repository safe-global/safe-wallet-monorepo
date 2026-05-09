import { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
  Severity,
} from '@safe-global/utils/features/safe-shield/types'
import React from 'react'
import { View } from 'tamagui'
import { getOverallStatus } from '@safe-global/utils/features/safe-shield/utils'
import { AnalysisDetailsHeader } from './AnalysisDetailsHeader'
import { AnalysisDetailsContent } from './AnalysisDetailsContent'
import type { SafeTransaction } from '@safe-global/types-kit'

interface SafeShieldWidgetProps {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  safeTx?: SafeTransaction
}
export const AnalysisDetails = ({ recipient, contract, threat, safeTx }: SafeShieldWidgetProps) => {
  // Extract data, error, and loading from each AsyncResult
  const [recipientData, recipientError] = recipient || []
  const [contractData, contractError] = contract || []
  const [threatData, threatError] = threat || []

  const hasAnyError = !!recipientError || !!contractError || !!threatError || !safeTx
  const overallStatus = getOverallStatus(recipientData, contractData, threatData) ?? null

  const severity = hasAnyError ? Severity.ERROR : overallStatus?.severity || Severity.OK
  return (
    <View backgroundColor="$backgroundPaper" width="100%" borderRadius={12} padding="$1">
      <AnalysisDetailsHeader severity={severity} />

      <AnalysisDetailsContent recipient={recipient} contract={contract} threat={threat} safeTx={safeTx} />
    </View>
  )
}
