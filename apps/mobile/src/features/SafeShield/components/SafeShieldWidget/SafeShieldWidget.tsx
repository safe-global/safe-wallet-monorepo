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
import { useRouter } from 'expo-router'
import type { SafeTransaction } from '@safe-global/types-kit'
import { isEmpty } from 'lodash'

interface SafeShieldWidgetProps {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  safeTx?: SafeTransaction
  txId?: string
}

export function SafeShieldWidget({ recipient, contract, threat, safeTx, txId }: SafeShieldWidgetProps) {
  const router = useRouter()

  const onPress = () => {
    if (txId) {
      const params: Record<string, string> = {
        txId,
        recipient: JSON.stringify(recipient),
        contract: JSON.stringify(contract),
        threat: JSON.stringify(threat),
      }

      router.push({
        pathname: '/safe-shield-details-sheet',
        params,
      })
    }
  }

  // Extract data, error, and loading from each AsyncResult
  const [recipientData, recipientError, recipientLoading = false] = recipient || []
  const [contractData, contractError, contractLoading = false] = contract || []
  const [threatData, threatError, threatLoading = false] = threat || []

  // Determine overall error state - true if ALL have errors (and at least one exists)
  const hasRecipient = recipient !== undefined
  const hasContract = contract !== undefined
  const hasThreat = threat !== undefined

  const allEmpty = isEmpty(recipientData) && isEmpty(contractData) && isEmpty(threatData)

  const allHaveErrors =
    (hasRecipient ? !!recipientError : true) &&
    (hasContract ? !!contractError : true) &&
    (hasThreat ? !!threatError : true)

  // Determine overall loading state - true if ANY is loading
  const loading = recipientLoading || contractLoading || threatLoading || (allEmpty && !allHaveErrors)

  // Get actual status from analysis
  const overallStatus = getOverallStatus(recipientData, contractData, threatData) ?? null

  return (
    <Stack gap="$3" padding="$1" borderRadius="$2" paddingBottom="$4" backgroundColor="$backgroundPaper">
      <WidgetAction onPress={onPress} loading={loading} error={allHaveErrors} status={overallStatus} />

      <WidgetDisplay
        recipient={recipient}
        contract={contract}
        threat={threat}
        loading={loading}
        error={allHaveErrors || (allEmpty && !loading)}
        safeTx={safeTx}
      />
    </Stack>
  )
}
