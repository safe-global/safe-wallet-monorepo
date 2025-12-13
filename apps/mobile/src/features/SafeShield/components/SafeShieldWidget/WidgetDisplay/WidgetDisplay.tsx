import React, { useMemo } from 'react'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { getPrimaryAnalysisResult } from '@safe-global/utils/features/safe-shield/utils/getPrimaryAnalysisResult'
import isEmpty from 'lodash/isEmpty'

import { AnalysisLabel } from '../../AnalysisLabel'
import { TransactionSimulation } from '../../TransactionSimulation'
import { useTransactionSimulation } from '../../TransactionSimulation/hooks/useTransactionSimulation'
import { useSafeShieldSeverity } from '../../../hooks/useSafeShieldSeverity'
import { WidgetDisplayWrapper } from './WidgetDisplayWrapper'
import { LoadingWidget } from './LoadingWidget'
import { getSeverity, normalizeThreatData } from '@safe-global/utils/features/safe-shield/utils'

import type { SafeTransaction } from '@safe-global/types-kit'
import { selectActiveChain } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'
import { isTxSimulationEnabled } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
interface WidgetDisplayProps {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  loading?: boolean
  safeTx?: SafeTransaction
}

export function WidgetDisplay({ recipient, contract, threat, loading, safeTx }: WidgetDisplayProps) {
  // Extract data from AsyncResults
  const [recipientData = {}] = recipient || []
  const [contractData = {}] = contract || []
  const normalizedThreatData = normalizeThreatData(threat)

  // Get primary results for each analysis type
  const primaryRecipient = getPrimaryAnalysisResult(recipientData)
  const primaryContract = getPrimaryAnalysisResult(contractData)
  const primaryThreat = getPrimaryAnalysisResult(normalizedThreatData)

  const chain = useAppSelector(selectActiveChain)

  const tenderlyEnabled = isTxSimulationEnabled(chain ?? undefined) ?? false

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

  const simulationSeverity = useMemo(
    () => getSeverity(isSuccess, simulationStatus.isFinished, hasError || isCallTraceError),
    [hasError, isCallTraceError, isSuccess, simulationStatus.isFinished],
  )

  // Get highlighted severity
  const highlightedSeverity = useSafeShieldSeverity({
    recipient,
    contract,
    threat,
    hasSimulationError: hasError || isCallTraceError,
  })

  // Check if analyses are empty
  const recipientEmpty = isEmpty(recipientData)
  const contractEmpty = isEmpty(contractData)
  const threatEmpty = isEmpty(normalizedThreatData)
  const allEmpty = recipientEmpty && contractEmpty && threatEmpty

  if (loading) {
    return <LoadingWidget />
  }

  // When all analyses are empty (no data returned), show nothing in the widget body
  // The header (WidgetAction) will handle showing "Checks unavailable" state
  if (allEmpty && !tenderlyEnabled) {
    return null
  }

  return (
    <WidgetDisplayWrapper>
      {safeTx === undefined && (
        <AnalysisLabel label="Failed to fetch analysis" severity={Severity.WARN} highlighted={true} />
      )}
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

      {tenderlyEnabled && safeTx && (
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
