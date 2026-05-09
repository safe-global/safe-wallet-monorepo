import { useMemo, type ReactElement } from 'react'
import type {
  ThreatAnalysisResults,
  Severity,
  GroupedAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics'
import isEmpty from 'lodash/isEmpty'
import { HypernativeFeature, type HypernativeAuthStatus } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'
import { AnalysisGroupCardDisabled } from './AnalysisGroupCardDisabled'

interface ThreatAnalysisProps {
  threat: AsyncResult<ThreatAnalysisResults>
  delay?: number
  highlightedSeverity?: Severity
  hypernativeAuth?: HypernativeAuthStatus
}

/**
 * Displays an analysis group card for the threat analysis results
 *
 * @param threat - The threat analysis results
 * @param delay - The delay before showing the threat analysis
 * @param highlightedSeverity - The highlighted severity
 * @returns The threat analysis group card or null if there are no threat results
 */
export const ThreatAnalysis = ({
  threat: [threatResults],
  delay,
  highlightedSeverity,
  hypernativeAuth,
}: ThreatAnalysisProps): ReactElement | null => {
  const hn = useLoadFeature(HypernativeFeature)
  const requiresHypernativeLogin =
    hypernativeAuth !== undefined && (!hypernativeAuth.isAuthenticated || hypernativeAuth.isTokenExpired)

  const threatData = useMemo<Record<string, GroupedAnalysisResults> | undefined>(() => {
    const { BALANCE_CHANGE: _, CUSTOM_CHECKS: __, request_id: ___, ...groupedThreatResults } = threatResults || {}

    if (Object.keys(groupedThreatResults).length === 0) return undefined

    return { ['0x']: groupedThreatResults }
  }, [threatResults])

  if (requiresHypernativeLogin) {
    return (
      <AnalysisGroupCardDisabled data-testid="threat-analysis-group-card">Threat analysis</AnalysisGroupCardDisabled>
    )
  }

  if (!threatResults || !threatData || isEmpty(threatData)) {
    return null
  }

  const CardComponent = hypernativeAuth && hn.$isReady ? hn.HnAnalysisGroupCard : AnalysisGroupCard

  return (
    <CardComponent
      data-testid="threat-analysis-group-card"
      data={threatData}
      delay={delay}
      highlightedSeverity={highlightedSeverity}
      analyticsEvent={SAFE_SHIELD_EVENTS.THREAT_ANALYZED}
      requestId={threatResults?.request_id}
    />
  )
}
