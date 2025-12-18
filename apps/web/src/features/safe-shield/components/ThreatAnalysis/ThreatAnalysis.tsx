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

interface ThreatAnalysisProps {
  threat: AsyncResult<ThreatAnalysisResults>
  delay?: number
  highlightedSeverity?: Severity
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
}: ThreatAnalysisProps): ReactElement | null => {
  const threatData = useMemo<Record<string, GroupedAnalysisResults> | undefined>(() => {
    const { BALANCE_CHANGE: _, CUSTOM_CHECKS: __, ...groupedThreatResults } = threatResults || {}

    if (Object.keys(groupedThreatResults).length === 0) return undefined

    return { ['0x']: groupedThreatResults }
  }, [threatResults])

  if (!threatResults || !threatData || isEmpty(threatData)) {
    return null
  }

  return (
    <AnalysisGroupCard
      data-testid="threat-analysis-group-card"
      data={threatData}
      delay={delay}
      highlightedSeverity={highlightedSeverity}
      analyticsEvent={SAFE_SHIELD_EVENTS.THREAT_ANALYZED}
      requestId={threatResults?.request_id}
    />
  )
}
