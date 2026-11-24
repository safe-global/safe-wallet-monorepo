import { useMemo, type ReactElement } from 'react'
import {
  type ThreatAnalysisResults,
  type Severity,
  type GroupedAnalysisResults,
  StatusGroup,
} from '@safe-global/utils/features/safe-shield/types'
import { sliceTopBySeverity } from '@safe-global/utils/features/safe-shield/utils'
import { AnalysisGroupCard } from '../AnalysisGroupCard/AnalysisGroupCard'
import { hasThreatCardResults } from '../../utils/hasThreatCardResults'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics/events/safe-shield'
import type { HypernativeAuthStatus } from '@/features/hypernative/public/hooks/useHypernativeOAuth'
import { HnViewMoreOnHypernativeRow } from '@/features/hypernative/public/components/HnViewMoreOnHypernativeRow'
import { AnalysisGroupCardDisabled } from '@safe-global/views/features/safe-shield/components/ThreatAnalysis/AnalysisGroupCardDisabled'
import { useSafeShieldAssessmentUrl } from '@/features/hypernative/public/hooks/useSafeShieldAssessmentUrl'
import HnAnalysisGroupCard from '@/features/hypernative/public/components/HnAnalysisGroupCard'
import { useIsHypernativeFeature } from '@/features/hypernative/public/hooks/useIsHypernativeFeature'

const VISIBLE_CAP = 3

interface ThreatAnalysisProps {
  threat: AsyncResult<ThreatAnalysisResults>
  delay?: number
  highlightedSeverity?: Severity
  hypernativeAuth?: HypernativeAuthStatus
}

/**
 * Displays an analysis group card for the threat analysis results.
 * Caps visible THREAT items at the top 3 by severity. The Hypernative path
 * adds an overflow row linking to the full report when more findings exist.
 */
export const ThreatAnalysis = ({
  threat: [threatResults],
  delay,
  highlightedSeverity,
  hypernativeAuth,
}: ThreatAnalysisProps): ReactElement | null => {
  const isHypernativeEnabled = useIsHypernativeFeature()
  const assessmentUrl = useSafeShieldAssessmentUrl()
  const requiresHypernativeLogin =
    hypernativeAuth !== undefined && (!hypernativeAuth.isAuthenticated || hypernativeAuth.isTokenExpired)

  const { threatData, overflow } = useMemo(() => {
    if (!hasThreatCardResults(threatResults)) {
      return { threatData: undefined, overflow: 0 }
    }

    const { BALANCE_CHANGE: _, CUSTOM_CHECKS: __, request_id: ___, ...groupedThreatResults } = threatResults || {}
    const { visible, overflow } = sliceTopBySeverity(groupedThreatResults.THREAT ?? [], VISIBLE_CAP)
    const next: GroupedAnalysisResults = { ...groupedThreatResults, THREAT: visible }
    return { threatData: { '0x': next } as Record<string, GroupedAnalysisResults>, overflow }
  }, [threatResults])

  if (requiresHypernativeLogin) {
    return (
      <AnalysisGroupCardDisabled data-testid="threat-analysis-group-card">Threat analysis</AnalysisGroupCardDisabled>
    )
  }

  if (!threatData) {
    return null
  }

  const isHnPath = Boolean(hypernativeAuth && isHypernativeEnabled)

  if (isHnPath) {
    const overflowRow =
      overflow > 0 ? <HnViewMoreOnHypernativeRow overflowCount={overflow} assessmentUrl={assessmentUrl} /> : undefined

    return (
      <HnAnalysisGroupCard
        data-testid="threat-analysis-group-card"
        data={threatData}
        delay={delay}
        highlightedSeverity={highlightedSeverity}
        analyticsEvent={SAFE_SHIELD_EVENTS.THREAT_ANALYZED}
        requestId={threatResults?.request_id}
        expandedGroups={[StatusGroup.THREAT]}
        overflowRow={overflowRow}
      />
    )
  }

  return (
    <AnalysisGroupCard
      data-testid="threat-analysis-group-card"
      data={threatData}
      delay={delay}
      highlightedSeverity={highlightedSeverity}
      analyticsEvent={SAFE_SHIELD_EVENTS.THREAT_ANALYZED}
      requestId={threatResults?.request_id}
      expandedGroups={[StatusGroup.THREAT]}
    />
  )
}
