import { type ReactElement } from 'react'
import type {
  ContractAnalysisResults,
  DeadlockAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SEVERITY_COLORS } from '../constants'
import type { ChecksCount } from '../utils/countChecks'
import { useDelayedLoading } from '../hooks/useDelayedLoading'
import { SafeShieldHeaderView } from '@views/features/safe-shield/components/SafeShieldHeaderView'

const headerVisibilityDelay = 500

export const SafeShieldHeader = ({
  recipient = [{}, undefined, false],
  contract = [{}, undefined, false],
  threat = [{}, undefined, false],
  deadlock = [{}, undefined, false],
  overallStatus,
  checks,
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  deadlock: AsyncResult<DeadlockAnalysisResults>
  overallStatus?: { severity: Severity; title: string }
  /** "N of M checks passed" replaces the plain title while nothing is amiss. */
  checks?: ChecksCount
}): ReactElement => {
  const [_recipientResults, recipientError, recipientLoading = false] = recipient
  const [_contractResults, contractError, contractLoading = false] = contract
  const [_threatResults, threatError, threatLoading = false] = threat
  const [_deadlockResults, deadlockError, deadlockLoading = false] = deadlock

  const loading = recipientLoading || contractLoading || threatLoading || deadlockLoading
  const error = recipientError || contractError || threatError || deadlockError
  const isLoadingVisible = useDelayedLoading(loading, headerVisibilityDelay)

  const headerBgColor =
    !overallStatus || !overallStatus?.severity || isLoadingVisible
      ? 'var(--color-background-default)'
      : SEVERITY_COLORS[overallStatus.severity].background

  const headerTextColor =
    !overallStatus || !overallStatus?.severity || isLoadingVisible
      ? 'var(--color-text-secondary)'
      : SEVERITY_COLORS[overallStatus.severity].main

  const checksPassed = overallStatus?.severity === Severity.OK && checks && checks.total > 0 ? checks : undefined

  return (
    <SafeShieldHeaderView
      backgroundColor={headerBgColor}
      textColor={headerTextColor}
      hasError={Boolean(error)}
      isLoadingVisible={isLoadingVisible}
      checksPassed={checksPassed}
      title={overallStatus?.title}
    />
  )
}
