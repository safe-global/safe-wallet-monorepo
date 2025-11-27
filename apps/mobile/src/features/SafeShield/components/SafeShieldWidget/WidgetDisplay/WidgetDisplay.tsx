import React, { useMemo } from 'react'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { getPrimaryAnalysisResult } from '@safe-global/utils/features/safe-shield/utils/getPrimaryAnalysisResult'
import { useHighlightedSeverity } from '@safe-global/utils/features/safe-shield/hooks/useHighlightedSeverity'
import isEmpty from 'lodash/isEmpty'

import { AnalysisLabel } from '../../AnalysisLabel'
import { TransactionSimulation } from '../../TransactionSimulation'
import { useTransactionSimulation } from '../../TransactionSimulation/hooks/useTransactionSimulation'
import { WidgetDisplayWrapper } from './WidgetDisplayWrapper'
import { ErrorWidget } from './ErrorWidget'
import { LoadingWidget } from './LoadingWidget'
import { normalizeThreatData } from '@safe-global/utils/features/safe-shield/utils'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

import type { SafeTransaction } from '@safe-global/types-kit'

interface WidgetDisplayProps {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  loading?: boolean
  error?: boolean
  safeTx?: SafeTransaction
  txId?: string
}

export function WidgetDisplay({ recipient, contract, threat, loading, error, safeTx, txId }: WidgetDisplayProps) {
  if (loading) {
    return <LoadingWidget />
  }

  if (error) {
    return <ErrorWidget />
  }

  // Extract data from AsyncResults
  const [recipientData = {}] = recipient || []
  const [contractData = {}] = contract || []
  const normalizedThreatData = normalizeThreatData(threat)

  // Get primary results for each analysis type
  const primaryRecipient = getPrimaryAnalysisResult(recipientData)
  const primaryContract = getPrimaryAnalysisResult(contractData)
  const primaryThreat = getPrimaryAnalysisResult(normalizedThreatData)

  // Transaction simulation logic
  const {
    hasError,
    isCallTraceError,
    isSuccess,
    simulationStatus,
    simulationLink,
    requestError,
    canSimulate,
    runSimulation,
  } = useTransactionSimulation(safeTx)

  const simulationSeverity = useMemo(() => {
    if (isSuccess) {
      return Severity.OK
    }
    if (simulationStatus.isFinished || hasError || isCallTraceError) {
      return Severity.WARN
    }
  }, [hasError, isCallTraceError, isSuccess, simulationStatus.isFinished])

  // Get highlighted severity
  const highlightedSeverity = useHighlightedSeverity(
    recipientData,
    contractData,
    normalizedThreatData,
    simulationSeverity === Severity.WARN,
  )

  // Check if analyses are empty
  const recipientEmpty = isEmpty(recipientData)
  const contractEmpty = isEmpty(contractData)
  const threatEmpty = isEmpty(normalizedThreatData)

  return (
    <WidgetDisplayWrapper>
      {!recipientEmpty && primaryRecipient && (
        <AnalysisLabel
          label={primaryRecipient.title}
          severity={primaryRecipient.severity}
          highlighted={primaryRecipient.severity === highlightedSeverity}
        />
      )}

      {!contractEmpty && primaryContract && (
        <AnalysisLabel
          label={primaryContract.title}
          severity={primaryContract.severity}
          highlighted={primaryContract.severity === highlightedSeverity}
        />
      )}

      {!threatEmpty && primaryThreat && (
        <AnalysisLabel
          label={primaryThreat.title}
          severity={primaryThreat.severity}
          highlighted={primaryThreat.severity === highlightedSeverity}
        />
      )}

      {highlightedSeverity && (
        <TransactionSimulation
          severity={simulationSeverity}
          highlighted={highlightedSeverity === simulationSeverity}
          simulationStatus={simulationStatus}
          simulationLink={simulationLink}
          requestError={requestError}
          canSimulate={canSimulate}
          onRunSimulation={runSimulation}
        />
      )}
    </WidgetDisplayWrapper>
  )
}
