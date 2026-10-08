import type { ReactElement } from 'react'
import { RefreshCw } from 'lucide-react'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import type { SafeGrade } from '@/features/security/types'
import SafeGradeChip, {
  SAFE_GRADE_LABEL,
} from '@views/features/spaces/components/SecurityHub/components/SafeGradeChip/SafeGradeChip'
import { ScoreGauge } from '@views/features/spaces/components/SecurityHub/components/WorkspaceHealthCard/WorkspaceGauge'
import { Button } from '@/components/ui/button'

const FILTER_GRADES: SafeGrade[] = ['critical', 'at_risk', 'needs_attention', 'passing']

export type WorkspaceHealthCardViewProps = {
  /** Aggregate score; null while no Safe has a result yet. */
  score: { scorePct: number; color: string } | null
  gradeCounts: Record<SafeGrade, number>
  isScanning: boolean
  activeFilter: SafeGrade | null
  onFilterChange: (grade: SafeGrade) => void
  lastScannedAt: number | null
  lastScannedLabel: string
  onRescan: () => void
  scanIncomplete: boolean
}

export const WorkspaceHealthCardView = ({
  score,
  gradeCounts,
  isScanning,
  activeFilter,
  onFilterChange,
  lastScannedAt,
  lastScannedLabel,
  onRescan,
  scanIncomplete,
}: WorkspaceHealthCardViewProps): ReactElement => {
  // Show skeleton only when we have no data at all. Once any Safe has completed, render the
  // aggregate incrementally — it updates as more results arrive. The re-scan row below
  // surfaces the in-progress state via its "Scanning..." label.
  if (!score) {
    return (
      // eslint-disable-next-line no-restricted-syntax -- p-6 gives this gauge row uniform padding (no CardContent slot); gap comes from the default size
      <Card className="mb-6 flex-col items-start p-6 md:flex-row md:items-center">
        <Skeleton className="size-[100px] shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-2 h-6 w-[180px] rounded" />
          <Skeleton className="mb-1 h-4 w-[320px] rounded" />
          <Skeleton className="mb-4 h-4 w-[260px] rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-[10px]" />
            <Skeleton className="h-5 w-[100px] rounded-[10px]" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    // eslint-disable-next-line no-restricted-syntax -- bespoke 20/24px gauge-row padding (py-5 px-6, no CardContent slot); gap comes from the default size
    <Card className="mb-10 flex-col items-start py-5 px-6 md:flex-row md:items-center">
      <div className="-mb-4">
        <ScoreGauge scorePct={score.scorePct} color={score.color} />
      </div>

      <div className="flex min-w-0 flex-1 justify-between">
        <div className="flex flex-col gap-2">
          <Typography variant="h4">Your security score</Typography>
          <Typography variant="paragraph-small" color="muted">
            Overview of security checks across your accounts
          </Typography>

          <div className="flex flex-wrap gap-2">
            {FILTER_GRADES.filter((grade) => gradeCounts[grade] > 0).map((grade) => (
              <SafeGradeChip
                key={grade}
                grade={grade}
                active={activeFilter === grade}
                label={`${SAFE_GRADE_LABEL[grade]} · ${gradeCounts[grade]} account${maybePlural(gradeCounts[grade])}`}
                onClick={() => onFilterChange(grade)}
              />
            ))}
          </div>
        </div>

        <div>
          {lastScannedAt && (
            <div className="mt-2 flex flex-col gap-1">
              <Button
                variant="outline"
                size="action"
                disabled={isScanning}
                className="self-end"
                onClick={isScanning ? undefined : onRescan}
              >
                <RefreshCw className={cn('size-5', isScanning && 'animate-spin')} strokeWidth={1.5} />

                {isScanning ? 'Scanning...' : 'Re-scan'}
              </Button>

              <Typography variant="paragraph-mini" color="muted">
                Last scanned: {lastScannedLabel}
              </Typography>
            </div>
          )}

          {scanIncomplete && !isScanning && (
            <Typography variant="paragraph-mini" className="mt-0.5 block text-[var(--color-warning-main)]">
              The last scan didn&apos;t finish. Showing your most recent complete score — re-scan to update it.
            </Typography>
          )}
        </div>
      </div>
    </Card>
  )
}
