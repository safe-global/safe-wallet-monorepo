import { useMemo, type ReactElement } from 'react'
import type { DeadlockAnalysisResults, Severity } from '@safe-global/utils/features/safe-shield/types'
import { AnalysisGroupCard } from '../AnalysisGroupCard'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics'
import isEmpty from 'lodash/isEmpty'

interface DeadlockAnalysisProps {
  deadlock: AsyncResult<DeadlockAnalysisResults>
  delay?: number
  highlightedSeverity?: Severity
}

export const DeadlockAnalysis = ({
  deadlock: [deadlockResults],
  delay,
  highlightedSeverity,
}: DeadlockAnalysisProps): ReactElement | null => {
  const deadlockData = useMemo(() => {
    if (!deadlockResults?.DEADLOCK || deadlockResults.DEADLOCK.length === 0) return undefined

    return { ['0x']: deadlockResults }
  }, [deadlockResults])

  if (!deadlockData || isEmpty(deadlockData)) {
    return null
  }

  return (
    <AnalysisGroupCard
      data-testid="deadlock-analysis-group-card"
      data={deadlockData}
      delay={delay}
      highlightedSeverity={highlightedSeverity}
      analyticsEvent={SAFE_SHIELD_EVENTS.DEADLOCK_ANALYZED}
    />
  )
}
