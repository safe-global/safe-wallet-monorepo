import { type ReactElement } from 'react'
import { Typography } from '@/components/ui/typography'
import type {
  ContractAnalysisResults,
  DeadlockAnalysisResults,
  RecipientAnalysisResults,
  Severity,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SEVERITY_COLORS } from '../constants'
import { useDelayedLoading } from '../hooks/useDelayedLoading'

const headerVisibilityDelay = 500

export const SafeShieldHeader = ({
  recipient = [{}, undefined, false],
  contract = [{}, undefined, false],
  threat = [{}, undefined, false],
  deadlock = [{}, undefined, false],
  overallStatus,
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  deadlock: AsyncResult<DeadlockAnalysisResults>
  overallStatus?: { severity: Severity; title: string }
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

  const label = error ? 'Checks unavailable' : isLoadingVisible ? 'Analyzing...' : (overallStatus?.title ?? 'Copilot')

  return (
    <div className="px-1 pt-1">
      <div
        data-testid="safe-shield-status"
        className="flex flex-row rounded-t-[6px] px-4 py-2"
        style={{ backgroundColor: headerBgColor }}
      >
        <Typography variant="paragraph-mini-bold" className="uppercase" style={{ color: headerTextColor }}>
          {label}
        </Typography>
      </div>
    </div>
  )
}
