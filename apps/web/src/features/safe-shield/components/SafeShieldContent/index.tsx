import type { ReactElement } from 'react'
import type {
  ContractAnalysisResults,
  DeadlockAnalysisResults,
  ThreatAnalysisResults,
  RecipientAnalysisResults,
  Severity,
  SafeAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldAnalysisLoading } from './SafeShieldAnalysisLoading'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import { TenderlySimulation } from '../TenderlySimulation'
import { TenderlySimulationLocked } from '../TenderlySimulationLocked'
import { useHasOwnTenderly } from '../../hooks/useHasOwnTenderly'
import { ProChecksRow } from '../ProChecksRow'
import { isContractCall } from '@/features/safe-shield/utils/isContractCall'
import { HypernativeLoginLine } from '../HypernativeLoginLine'
import UntrustedSafeWarning from '../UntrustedSafeWarning'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import isEmpty from 'lodash/isEmpty'
import type { SafeTransaction } from '@safe-global/types-kit'
import { analysisVisibilityDelay, calculateAnalysisDelays, useDelayedLoading } from '../../hooks/useDelayedLoading'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics'
import { HypernativeFeature, type HypernativeAuthStatus } from '@/features/hypernative'
import { SafenetChecksFeature } from '@/features/safenet-checks'
import { useLoadFeature } from '@/features/__core__'
import { ThreatAnalysis } from '../ThreatAnalysis'
import { SafeShieldContentView } from '@views/features/safe-shield/components/SafeShieldContent/SafeShieldContentView'

export const SafeShieldContent = ({
  recipient,
  contract,
  threat,
  deadlock,
  safeTx,
  overallStatus,
  hypernativeAuth,
  showHypernativeInfo = true,
  showHypernativeActiveStatus = true,
  safeAnalysis,
  onAddToTrustedList,
  hasProFeatures = true,
  isSafePro = true,
  isOffchainMessage = false,
}: {
  recipient: AsyncResult<RecipientAnalysisResults>
  contract: AsyncResult<ContractAnalysisResults>
  threat: AsyncResult<ThreatAnalysisResults>
  deadlock: AsyncResult<DeadlockAnalysisResults>
  safeTx?: SafeTransaction
  overallStatus?: { severity: Severity; title: string }
  hypernativeAuth?: HypernativeAuthStatus
  showHypernativeInfo?: boolean
  showHypernativeActiveStatus?: boolean
  safeAnalysis?: SafeAnalysisResult | null
  onAddToTrustedList?: () => void
  /** Without Safe Pro the simulation only runs on the user's own Tenderly project, if they set one up; else it is locked. */
  hasProFeatures?: boolean
  /** Off: the pre-Pro layout, with the counterparty checks among the open ones and the simulation run by hand. */
  isSafePro?: boolean
  isOffchainMessage?: boolean
}): ReactElement => {
  const hn = useLoadFeature(HypernativeFeature)
  const safenet = useLoadFeature(SafenetChecksFeature)
  const { HnInfoCard, HnCustomChecksCard } = hn
  const { SafenetChecksSection } = safenet
  const hasOwnTenderly = useHasOwnTenderly()
  const [recipientResults = {}, _recipientError, recipientLoading = false] = recipient
  const [contractResults = {}, _contractError, contractLoading = false] = contract
  const [threatResults = {}, _threatError, threatLoading = false] = threat
  const [deadlockResults = {}, _deadlockError, deadlockLoading = false] = deadlock

  const highlightedSeverity = overallStatus?.severity
  const loading = recipientLoading || contractLoading || threatLoading || deadlockLoading
  const isLoadingVisible = useDelayedLoading(loading, analysisVisibilityDelay)
  const shouldShowContent = !isLoadingVisible

  const recipientEmpty = isEmpty(recipientResults)
  const contractEmpty = isEmpty(contractResults)
  const threatEmpty = isEmpty(threatResults) || isEmpty(threatResults?.THREAT)
  const deadlockEmpty = isEmpty(deadlockResults)
  const analysesEmpty = recipientEmpty && contractEmpty && threatEmpty && deadlockEmpty
  const allEmpty = recipientEmpty && contractEmpty && threatEmpty && deadlockEmpty && !safeTx

  const { recipientDelay, contractAnalysisDelay, deadlockAnalysisDelay, threatAnalysisDelay, simulationAnalysisDelay } =
    calculateAnalysisDelays(recipientEmpty, contractEmpty, deadlockEmpty)

  const hasProContent = !recipientEmpty || !contractEmpty || !deadlockEmpty || !!safeTx

  const showProSection = isSafePro && shouldShowContent && !isOffchainMessage && (!hasProFeatures || hasProContent)

  // Contract and deadlock checks come from the counterparty analysis, a Safe Pro feature like the recipient check
  const contractCard = (
    <AnalysisGroupCard
      data-testid="contract-analysis-group-card"
      data={contractResults}
      delay={contractAnalysisDelay}
      highlightedSeverity={highlightedSeverity}
      analyticsEvent={SAFE_SHIELD_EVENTS.CONTRACT_DECODED}
      showImage
    />
  )

  const deadlockCard = (
    <AnalysisGroupCard
      data-testid="deadlock-analysis-group-card"
      data={deadlockResults}
      delay={deadlockAnalysisDelay}
      highlightedSeverity={highlightedSeverity}
      analyticsEvent={SAFE_SHIELD_EVENTS.DEADLOCK_ANALYZED}
    />
  )

  return (
    <SafeShieldContentView
      hnInfoCard={
        showHypernativeInfo && (
          <HnInfoCard hypernativeAuth={hypernativeAuth} showActiveStatus={showHypernativeActiveStatus} />
        )
      }
      loading={
        isLoadingVisible && <SafeShieldAnalysisLoading analysesEmpty={analysesEmpty} loading={isLoadingVisible} />
      }
      showEmpty={shouldShowContent && !loading && allEmpty && !hypernativeAuth}
      openChecks={
        <>
          {/* Untrusted Safe warning - shown at top when Safe is not pinned */}
          {safeAnalysis && onAddToTrustedList && (
            <UntrustedSafeWarning safeAnalysis={safeAnalysis} onAddToTrustedList={onAddToTrustedList} />
          )}

          {!isSafePro && (
            <AnalysisGroupCard
              data-testid="recipient-analysis-group-card"
              delay={recipientDelay}
              data={recipientResults}
              highlightedSeverity={highlightedSeverity}
              analyticsEvent={SAFE_SHIELD_EVENTS.RECIPIENT_DECODED}
            />
          )}

          {!isSafePro && contractCard}

          {!isSafePro && deadlockCard}

          <ThreatAnalysis
            threat={threat}
            delay={threatAnalysisDelay}
            highlightedSeverity={highlightedSeverity}
            hypernativeAuth={hypernativeAuth}
          />

          <HnCustomChecksCard
            threat={threat}
            delay={threatAnalysisDelay}
            highlightedSeverity={highlightedSeverity}
            hypernativeAuth={hypernativeAuth}
          />

          {shouldShowContent && <SafenetChecksSection />}

          {!isSafePro && !contractLoading && !threatLoading && (
            <TenderlySimulation
              safeTx={safeTx}
              delay={simulationAnalysisDelay}
              highlightedSeverity={highlightedSeverity}
            />
          )}
        </>
      }
      showProSection={showProSection}
      proChecksRow={<ProChecksRow hasProFeatures={hasProFeatures} />}
      hasProFeatures={hasProFeatures}
      isContractCall={isContractCall(safeTx)}
      proRecipientCard={
        <AnalysisGroupCard
          data-testid="recipient-analysis-group-card"
          delay={recipientDelay}
          data={recipientResults}
          highlightedSeverity={highlightedSeverity}
          analyticsEvent={SAFE_SHIELD_EVENTS.RECIPIENT_DECODED}
        />
      }
      proContractCard={contractCard}
      proDeadlockCard={deadlockCard}
      proSimulation={
        !contractLoading &&
        !threatLoading &&
        (hasProFeatures || hasOwnTenderly) && (
          <TenderlySimulation
            safeTx={safeTx}
            delay={simulationAnalysisDelay}
            highlightedSeverity={highlightedSeverity}
            autoRun={hasProFeatures}
          />
        )
      }
      simulationLocked={!hasProFeatures && !hasOwnTenderly && <TenderlySimulationLocked />}
      hypernativeLoginLine={shouldShowContent && <HypernativeLoginLine hypernativeAuth={hypernativeAuth} />}
    />
  )
}
