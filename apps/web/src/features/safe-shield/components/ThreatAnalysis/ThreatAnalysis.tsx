import { useMemo, type ReactElement } from 'react'
import {
  type ThreatAnalysisResults,
  type Severity,
  type GroupedAnalysisResults,
  StatusGroup,
} from '@safe-global/utils/features/safe-shield/types'
import { sliceTopBySeverity } from '@safe-global/utils/features/safe-shield/utils'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics'
import isEmpty from 'lodash/isEmpty'
import { HypernativeFeature, type HypernativeAuthStatus, HnViewMoreOnHypernativeRow } from '@/features/hypernative'
import { useLoadFeature } from '@/features/__core__'
import { AnalysisGroupCardDisabled } from './AnalysisGroupCardDisabled'
// eslint-disable-next-line no-restricted-imports -- re-exporting this hook from the hypernative barrel closes a hypernative<->safe-shield<->tx-flow module-init cycle (TDZ)
import { useSafeShieldAssessmentUrl } from '@/features/hypernative/hooks/useSafeShieldAssessmentUrl'

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
  const hn = useLoadFeature(HypernativeFeature)
  const assessmentUrl = useSafeShieldAssessmentUrl()
  const requiresHypernativeLogin =
    hypernativeAuth !== undefined && (!hypernativeAuth.isAuthenticated || hypernativeAuth.isTokenExpired)

  const { threatData, overflow } = useMemo(() => {
    const { BALANCE_CHANGE: _, CUSTOM_CHECKS: __, request_id: ___, ...groupedThreatResults } = threatResults || {}

    if (Object.keys(groupedThreatResults).length === 0) {
      return { threatData: undefined, overflow: 0 }
    }

    const { visible, overflow } = sliceTopBySeverity(groupedThreatResults.THREAT ?? [], VISIBLE_CAP)
    const next: GroupedAnalysisResults = { ...groupedThreatResults, THREAT: visible }
    return { threatData: { '0x': next } as Record<string, GroupedAnalysisResults>, overflow }
  }, [threatResults])

  if (requiresHypernativeLogin) {
    return (
      <AnalysisGroupCardDisabled data-testid="threat-analysis-group-card">Threat analysis</AnalysisGroupCardDisabled>
    )
  }

  if (!threatResults || !threatData || isEmpty(threatData)) {
    return null
  }

  const isHnPath = Boolean(hypernativeAuth && hn.$isReady)

  if (isHnPath) {
    const overflowRow =
      overflow > 0 ? <HnViewMoreOnHypernativeRow overflowCount={overflow} assessmentUrl={assessmentUrl} /> : undefined

    return (
      <hn.HnAnalysisGroupCard
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
