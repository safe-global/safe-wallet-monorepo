import { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
  Severity,
} from '@safe-global/utils/features/safe-shield/types'
import React from 'react'
import { ScrollView, View } from 'tamagui'
import { getOverallStatus } from '@safe-global/utils/features/safe-shield/utils'
import { AnalysisDetailsHeader } from './AnalysisDetailsHeader'
import { AnalysisDetailsContent } from './AnalysisDetailsContent'
import type { SafeTransaction } from '@safe-global/types-kit'

interface SafeShieldWidgetProps {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  safeTx?: SafeTransaction
  txId?: string
}
export const AnalysisDetails = ({ recipient, contract, threat, safeTx, txId }: SafeShieldWidgetProps) => {
  // Extract data, error, and loading from each AsyncResult
  const [recipientData] = recipient || []
  const [contractData] = contract || []
  const [threatData] = threat || []

  const overallStatus = getOverallStatus(recipientData, contractData, threatData) ?? null

  return (
    <View backgroundColor="$background" borderRadius={12} padding="$1">
      <AnalysisDetailsHeader severity={overallStatus?.severity || Severity.OK} />

      <AnalysisDetailsContent recipient={recipient} contract={contract} threat={threat} safeTx={safeTx} />
    </View>
  )
}
