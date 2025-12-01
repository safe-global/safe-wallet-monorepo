import { type ReactElement } from 'react'
import { Box } from '@mui/material'
import type {
  GroupedAnalysisResults,
  ContractAnalysisResults,
  ThreatAnalysisResults,
  RecipientAnalysisResults,
  Severity,
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldAnalysisLoading } from './SafeShieldAnalysisLoading'
import { SafeShieldAnalysisEmpty } from './SafeShieldAnalysisEmpty'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import { TenderlySimulation } from '../TenderlySimulation'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import isEmpty from 'lodash/isEmpty'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useHighlightedSeverity } from '@safe-global/utils/features/safe-shield/hooks/useHighlightedSeverity'
import { useCheckSimulation } from '@/features/safe-shield/hooks/useCheckSimulation'
import {
  analysisVisibilityDelay,
  calculateAnalysisDelays,
  useDelayedLoading,
} from '@/features/safe-shield/hooks/useDelayedLoading'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics'

const normalizeThreatData = (threat?: AsyncResult<ThreatAnalysisResults>): Record<string, GroupedAnalysisResults> => {
  const [result] = threat || []

  const { BALANCE_CHANGE: _, ...groupedThreatResults } = result || {}

  if (Object.keys(groupedThreatResults).length === 0) return {}

  return { ['0x']: groupedThreatResults }
}

export const SafeShieldContent = ({
  recipient,
  contract,
  threat,
  safeTx,
  overallStatus,
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  safeTx?: SafeTransaction
  overallStatus?: { severity: Severity; title: string } | undefined
}): ReactElement => {
  const [recipientResults = {}, _recipientError, recipientLoading = false] = recipient || []
  const [contractResults = {}, _contractError, contractLoading = false] = contract || []
  const [threatResults, _threatError, threatLoading = false] = threat || []

  const normalizedThreatData = normalizeThreatData(threat)
  const { hasSimulationError } = useCheckSimulation(safeTx)
  const highlightedSeverity = useHighlightedSeverity(
    recipientResults,
    contractResults,
    normalizedThreatData,
    hasSimulationError,
  )
  const loading = recipientLoading || contractLoading || threatLoading
  const isLoadingVisible = useDelayedLoading(loading, analysisVisibilityDelay)
  const shouldShowContent = !isLoadingVisible

  const recipientEmpty = isEmpty(recipientResults)
  const contractEmpty = isEmpty(contractResults)
  const threatEmpty = isEmpty(threatResults) || isEmpty(threatResults?.THREAT)
  const analysesEmpty = recipientEmpty && contractEmpty && threatEmpty
  const allEmpty = recipientEmpty && contractEmpty && threatEmpty && !safeTx

  const { recipientDelay, contractAnalysisDelay, threatAnalysisDelay, simulationAnalysisDelay } =
    calculateAnalysisDelays(recipientEmpty, contractEmpty)

  return (
    <Box padding="0px 4px 4px">
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'background.main',
          borderTop: 'none',
          borderRadius: '0px 0px 6px 6px',
          position: 'relative',
        }}
      >
        {isLoadingVisible && <SafeShieldAnalysisLoading analysesEmpty={analysesEmpty} loading={isLoadingVisible} />}

        {shouldShowContent && !loading && allEmpty && <SafeShieldAnalysisEmpty />}

        <Box sx={{ '& > div:not(:last-child)': { borderBottom: '1px solid', borderColor: 'background.main' } }}>
          <AnalysisGroupCard
            data-testid="recipient-analysis-group-card"
            delay={recipientDelay}
            data={recipientResults}
            highlightedSeverity={highlightedSeverity}
            analyticsEvent={SAFE_SHIELD_EVENTS.RECIPIENT_DECODED}
          />

          <AnalysisGroupCard
            data-testid="contract-analysis-group-card"
            data={contractResults}
            delay={contractAnalysisDelay}
            highlightedSeverity={highlightedSeverity}
            analyticsEvent={SAFE_SHIELD_EVENTS.CONTRACT_DECODED}
            showImage
          />

          <AnalysisGroupCard
            data-testid="threat-analysis-group-card"
            data={normalizedThreatData}
            delay={threatAnalysisDelay}
            highlightedSeverity={highlightedSeverity}
            analyticsEvent={SAFE_SHIELD_EVENTS.THREAT_ANALYZED}
            requestId={threatResults?.request_id}
          />

          {!contractLoading && !threatLoading && (
            <TenderlySimulation
              safeTx={safeTx}
              delay={simulationAnalysisDelay}
              highlightedSeverity={highlightedSeverity}
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}
