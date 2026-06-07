import type { ReactElement } from 'react'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import type { ScanContext, ScanResult } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import { usePanelHeader } from '../../SecurityPanelView/hooks/usePanelHeader'
import SecurityChecksSection from '../../SecurityPanelView/SecurityChecksSection'
import { ScoreGauge } from '../../WorkspaceHealthCard/WorkspaceGauge'
import SafeGradeChip from '../../SafeGradeChip/SafeGradeChip'

type SecurityDrawerChecksProps = {
  scanContext: ScanContext | null
  results: Record<string, ScanResult>
  isComplete: boolean
  lastScannedAt: number | null
  /** The `shortName:address` param used to deep-link a CTA to the correct Safe (e.g., "eth:0x..."). */
  safeQueryParam?: string
}

/**
 * "Checks" tab — a score summary card (gauge + grade + scan time + issue count)
 * followed by the existing per-check rows.
 */
const SecurityDrawerChecks = ({
  scanContext,
  results,
  isComplete,
  lastScannedAt,
  safeQueryParam,
}: SecurityDrawerChecksProps): ReactElement => {
  const security = useLoadFeature(SecurityFeature)
  const header = usePanelHeader(results, isComplete)
  const hasResults = Object.keys(results).length > 0

  if (!scanContext || !security.$isReady || header.status === 'loading' || (!hasResults && !isComplete)) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    )
  }

  const summary = security.computeSummary(results)
  const grade = security.getSafeGrade(results)
  const issueCount = summary ? summary.applicableCount - summary.passing : 0

  return (
    <div className="flex flex-col gap-6">
      {header.status === 'ready' && (
        <Card className="h-[88px] flex-row items-center gap-3 px-4 py-0 dark:bg-secondary">
          <ScoreGauge scorePct={header.score} color={header.band.color} size="small" />

          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <SafeGradeChip grade={grade} />
              <Typography variant="paragraph-mini" color="muted">
                Scanned {security.formatTimestamp(lastScannedAt ?? undefined)}
              </Typography>
            </div>
            <Typography variant="paragraph-mini">
              {issueCount === 0 ? 'No issues found' : `${issueCount} issue${maybePlural(issueCount)} found`}
            </Typography>
          </div>
        </Card>
      )}

      <SecurityChecksSection scanContext={scanContext} results={results} safeQueryParam={safeQueryParam} />
    </div>
  )
}

export default SecurityDrawerChecks
