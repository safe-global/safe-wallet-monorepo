import { useMemo, type ReactElement } from 'react'
import type { ThreatAnalysisResults, Severity } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics'
import { AnalysisGroupCardDisabled } from '@/features/safe-shield/components/ThreatAnalysis/AnalysisGroupCardDisabled'
import { HnAnalysisGroupCard } from '../HnAnalysisGroupCard'
import type { HypernativeAuthStatus } from '../../hooks/useHypernativeOAuth'

export interface HnCustomChecksCardProps {
  threat: AsyncResult<ThreatAnalysisResults>
  delay?: number
  highlightedSeverity?: Severity
  hypernativeAuth?: HypernativeAuthStatus
}

/**
 * Displays an analysis group card for the Hypernative custom checks.
 * Shows the "by Hypernative" branding in the footer.
 */
export const HnCustomChecksCard = ({
  threat: [threatResults],
  delay,
  highlightedSeverity,
  hypernativeAuth,
}: HnCustomChecksCardProps): ReactElement | null => {
  const requiresHypernativeLogin =
    hypernativeAuth !== undefined && (!hypernativeAuth.isAuthenticated || hypernativeAuth.isTokenExpired)

  const customChecksData = useMemo(() => ({ ['0x']: { CUSTOM_CHECKS: threatResults?.CUSTOM_CHECKS } }), [threatResults])

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

  return (
    <HnAnalysisGroupCard
      data-testid="custom-checks-analysis-group-card"
      data={customChecksData}
      delay={delay}
      highlightedSeverity={highlightedSeverity}
      analyticsEvent={SAFE_SHIELD_EVENTS.CUSTOM_CHECKS_ANALYZED}
    />
  )
}
