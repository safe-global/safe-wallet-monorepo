import type { ReactElement } from 'react'
import { AnalysisGroupCardDisabled } from '@views/features/safe-shield/components/ThreatAnalysis/AnalysisGroupCardDisabled'

export const HnCustomChecksCardLoginRequiredView = (): ReactElement => {
  return (
    <AnalysisGroupCardDisabled data-testid="custom-checks-analysis-group-card">Custom checks</AnalysisGroupCardDisabled>
  )
}
