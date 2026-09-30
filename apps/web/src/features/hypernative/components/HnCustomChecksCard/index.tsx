import { useMemo, type ReactElement } from 'react'
import { StatusGroup, type ThreatAnalysisResults, type Severity } from '@safe-global/utils/features/safe-shield/types'
import { sliceTopBySeverity } from '@safe-global/utils/features/safe-shield/utils'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics'
import { AnalysisGroupCardDisabled } from '@/features/safe-shield'
import { HnAnalysisGroupCard } from '../HnAnalysisGroupCard'
import { HnViewMoreOnHypernativeRow } from '../HnViewMoreOnHypernativeRow'
import { useSafeShieldAssessmentUrl } from '../../hooks/useSafeShieldAssessmentUrl'
import type { HypernativeAuthStatus } from '../../hooks/useHypernativeOAuth'

const VISIBLE_CAP = 3

export interface HnCustomChecksCardProps {
  threat: AsyncResult<ThreatAnalysisResults>
  delay?: number
  highlightedSeverity?: Severity
  hypernativeAuth?: HypernativeAuthStatus
}

/**
 * Displays the Hypernative custom checks card. Shows the top 3 custom check
 * results by severity. When more findings exist, renders an overflow row that
 * deep-links to the full report on Hypernative.
 */
export const HnCustomChecksCard = ({
  threat: [threatResults],
  delay,
  highlightedSeverity,
  hypernativeAuth,
}: HnCustomChecksCardProps): ReactElement | null => {
  const assessmentUrl = useSafeShieldAssessmentUrl()
  const requiresHypernativeLogin =
    hypernativeAuth !== undefined && (!hypernativeAuth.isAuthenticated || hypernativeAuth.isTokenExpired)

  const { customChecksData, overflow } = useMemo(() => {
    const all = threatResults?.CUSTOM_CHECKS ?? []
    const { visible, overflow } = sliceTopBySeverity(all, VISIBLE_CAP)
    return {
      customChecksData: { '0x': { CUSTOM_CHECKS: visible } },
      overflow,
    }
  }, [threatResults])

  if (requiresHypernativeLogin) {
    return (
      <AnalysisGroupCardDisabled data-testid="custom-checks-analysis-group-card">
        Custom checks
      </AnalysisGroupCardDisabled>
    )
  }

  if (!threatResults?.CUSTOM_CHECKS || threatResults.CUSTOM_CHECKS.length === 0) {
    return null
  }

  const overflowRow =
    overflow > 0 ? <HnViewMoreOnHypernativeRow overflowCount={overflow} assessmentUrl={assessmentUrl} /> : undefined

  return (
    <HnAnalysisGroupCard
      data-testid="custom-checks-analysis-group-card"
      data={customChecksData}
      delay={delay}
      highlightedSeverity={highlightedSeverity}
      analyticsEvent={SAFE_SHIELD_EVENTS.CUSTOM_CHECKS_ANALYZED}
      expandedGroups={[StatusGroup.CUSTOM_CHECKS]}
      overflowRow={overflowRow}
    />
  )
}
