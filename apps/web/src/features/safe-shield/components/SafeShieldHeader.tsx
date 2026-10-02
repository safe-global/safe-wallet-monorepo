import { type ReactElement, type ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
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
import { cn } from '@/utils/cn'

const headerVisibilityDelay = 500

export const SafeShieldHeader = ({
  recipient = [{}, undefined, false],
  contract = [{}, undefined, false],
  threat = [{}, undefined, false],
  deadlock = [{}, undefined, false],
  overallStatus,
  checks,
  isPending = false,
  trailing,
  variant = 'pill',
}: {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  deadlock: AsyncResult<DeadlockAnalysisResults>
  overallStatus?: { severity: Severity; title: string }
  /** "N of M checks passed" replaces the plain title while nothing is amiss. */
  checks?: ChecksCount
  /** A check is still running: shows a pulsing dot before the label. */
  isPending?: boolean
  /** Right-aligned extra, e.g. a countdown. */
  trailing?: ReactNode
  /** `cap`: a full-width top row with a bottom border, for an outlined card (Safenet prototype). */
  variant?: 'pill' | 'cap'
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

  const okTitle =
    overallStatus?.severity === Severity.OK && checks && checks.total > 0
      ? `${checks.passed} of ${checks.total} checks passed`
      : overallStatus?.title
  const label = error ? 'Checks unavailable' : isLoadingVisible ? 'Analyzing...' : (okTitle ?? 'Copilot')

  return (
    <div className={cn(variant === 'pill' && 'px-1 pt-1')}>
      <div
        data-testid="safe-shield-status"
        className={cn(
          'flex flex-row items-center gap-2',
          variant === 'pill' ? 'rounded-md px-4 py-2' : 'h-9 border-b border-border px-3',
        )}
        style={{ backgroundColor: headerBgColor }}
      >
        {isPending && !isLoadingVisible && (
          <span
            className="size-1.5 shrink-0 rounded-full motion-safe:animate-pulse"
            style={{ backgroundColor: headerTextColor }}
            aria-hidden
          />
        )}
        <Typography variant="paragraph-mini-bold" className="uppercase" style={{ color: headerTextColor }}>
          {label}
        </Typography>
        {trailing && !isLoadingVisible && (
          <Typography variant="paragraph-mini" className="ml-auto" style={{ color: headerTextColor }}>
            {trailing}
          </Typography>
        )}
      </div>
    </div>
  )
}
