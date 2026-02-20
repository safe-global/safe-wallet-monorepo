import type { ReactElement } from 'react'
import { Box } from '@mui/material'
import type {
  ContractAnalysisResults,
  ThreatAnalysisResults,
  RecipientAnalysisResults,
  Severity,
  SafeAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldAnalysisLoading } from './SafeShieldAnalysisLoading'
import { SafeShieldAnalysisEmpty } from './SafeShieldAnalysisEmpty'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import { TenderlySimulation } from '../TenderlySimulation'
import UntrustedSafeWarning from '../UntrustedSafeWarning'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import isEmpty from 'lodash/isEmpty'
import type { SafeTransaction } from '@safe-global/types-kit'
import {
  analysisVisibilityDelay,
  calculateAnalysisDelays,
  useDelayedLoading,
} from '@/features/safe-shield/hooks/useDelayedLoading'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics'
import { HypernativeFeature, type HypernativeAuthStatus } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'
import { ThreatAnalysis } from '@/features/safe-shield/components/ThreatAnalysis'

export const SafeShieldContent = ({
  recipient,
  contract,
  threat,
  safeTx,
  overallStatus,
  hypernativeAuth,
  showHypernativeInfo = true,
  showHypernativeActiveStatus = true,
  safeAnalysis,
  onAddToTrustedList,
}: {
  recipient: AsyncResult<RecipientAnalysisResults>
  contract: AsyncResult<ContractAnalysisResults>
  threat: AsyncResult<ThreatAnalysisResults>
  safeTx?: SafeTransaction
  overallStatus?: { severity: Severity; title: string }
  hypernativeAuth?: HypernativeAuthStatus
  showHypernativeInfo?: boolean
  showHypernativeActiveStatus?: boolean
  safeAnalysis?: SafeAnalysisResult | null
  onAddToTrustedList?: () => void
}): ReactElement => {
  const hn = useLoadFeature(HypernativeFeature)
  const [recipientResults = {}, _recipientError, recipientLoading = false] = recipient
  const [contractResults = {}, _contractError, contractLoading = false] = contract
  const [threatResults = {}, _threatError, threatLoading = false] = threat

  const highlightedSeverity = overallStatus?.severity
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
        {showHypernativeInfo && (
          <hn.HnInfoCard hypernativeAuth={hypernativeAuth} showActiveStatus={showHypernativeActiveStatus} />
        )}

        {isLoadingVisible && <SafeShieldAnalysisLoading analysesEmpty={analysesEmpty} loading={isLoadingVisible} />}

        {shouldShowContent && !loading && allEmpty && !hypernativeAuth && <SafeShieldAnalysisEmpty />}

        <Box sx={{ '& > div': { borderTop: '1px solid', borderColor: 'background.main' } }}>
          {/* Untrusted Safe warning - shown at top when Safe is not pinned */}
          {safeAnalysis && onAddToTrustedList && (
            <UntrustedSafeWarning safeAnalysis={safeAnalysis} onAddToTrustedList={onAddToTrustedList} />
          )}

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

          <ThreatAnalysis
            threat={threat}
            delay={threatAnalysisDelay}
            highlightedSeverity={highlightedSeverity}
            hypernativeAuth={hypernativeAuth}
          />

          <hn.HnCustomChecksCard
            threat={threat}
            delay={threatAnalysisDelay}
            highlightedSeverity={highlightedSeverity}
            hypernativeAuth={hypernativeAuth}
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
