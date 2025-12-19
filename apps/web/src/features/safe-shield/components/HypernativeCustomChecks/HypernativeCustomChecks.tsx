import { useMemo, type ReactElement } from 'react'
import type { ThreatAnalysisResults, Severity } from '@safe-global/utils/features/safe-shield/types'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics'
import { AnalysisGroupCardDisabled } from '../ThreatAnalysis/AnalysisGroupCardDisabled'
import type { HypernativeAuthStatus } from '@/features/hypernative/hooks/useHypernativeOAuth'

interface HypernativeCustomChecksProps {
  threat: AsyncResult<ThreatAnalysisResults>
  delay?: number
  highlightedSeverity?: Severity
  hypernativeAuth?: HypernativeAuthStatus
}

/**
 * Displays a analysis group card for the Hypernative custom checks
 *
 * @param threat - The threat analysis results
 * @param delay - The delay before showing the custom checks
 * @param highlightedSeverity - The highlighted severity
 * @returns The custom checks analysis group card or null if there are no custom checks
 */
export const HypernativeCustomChecks = ({
  threat: [threatResults],
  delay,
  highlightedSeverity,
  hypernativeAuth,
}: HypernativeCustomChecksProps): ReactElement | null => {
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

  if (!threatResults || !threatResults.CUSTOM_CHECKS || Object.keys(threatResults.CUSTOM_CHECKS || {}).length === 0) {
    return null
  }

  return (
    <AnalysisGroupCard
      data-testid="custom-checks-analysis-group-card"
      data={customChecksData}
      delay={delay}
      highlightedSeverity={highlightedSeverity}
      analyticsEvent={SAFE_SHIELD_EVENTS.CUSTOM_CHECKS_ANALYZED}
    />
  )
}
