import type { ReactElement } from 'react'
import { AnalysisGroupCardDisabled } from '@views/features/safe-shield/components/ThreatAnalysis/AnalysisGroupCardDisabled'

export type ThreatAnalysisViewProps = Record<string, never>

/** Shown in place of the threat card while a Hypernative login is required. */
export const ThreatAnalysisView = (): ReactElement => {
  return <AnalysisGroupCardDisabled data-testid="threat-analysis-group-card">Threat analysis</AnalysisGroupCardDisabled>
}
