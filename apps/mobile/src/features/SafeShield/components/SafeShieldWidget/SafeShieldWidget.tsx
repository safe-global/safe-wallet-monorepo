import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import React from 'react'
import { Stack } from 'tamagui'
import { WidgetAction } from './WidgetAction'
import { WidgetDisplay } from './WidgetDisplay'
import { getOverallStatus } from '@safe-global/utils/features/safe-shield/utils'

interface SafeShieldWidgetProps {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
}

export function SafeShieldWidget({ recipient, contract, threat }: SafeShieldWidgetProps) {
  const onPress = () => {}

  // Extract data, error, and loading from each AsyncResult
  const [recipientData, recipientError, recipientLoading = false] = recipient || []
  const [contractData, contractError, contractLoading = false] = contract || []
  const [threatData, threatError, threatLoading = false] = threat || []

  // Determine overall loading state - true if ANY is loading
  const loading = recipientLoading || contractLoading || threatLoading

  // Determine overall error state - true if ALL have errors (and at least one exists)
  const hasRecipient = recipient !== undefined
  const hasContract = contract !== undefined
  const hasThreat = threat !== undefined
  const allHaveErrors =
    (hasRecipient ? !!recipientError : true) &&
    (hasContract ? !!contractError : true) &&
    (hasThreat ? !!threatError : true)
  const error = (hasRecipient || hasContract || hasThreat) && allHaveErrors

  // Get actual status from analysis
  const overallStatus = getOverallStatus(recipientData, contractData, threatData) ?? null

  return (
    <Stack gap="$3" padding="$1" borderRadius="$2" paddingBottom="$4" backgroundColor="$backgroundPaper">
      <WidgetAction onPress={onPress} loading={loading} error={error} status={overallStatus} />

      <WidgetDisplay recipient={recipient} contract={contract} threat={threat} loading={loading} error={error} />
    </Stack>
  )
}
