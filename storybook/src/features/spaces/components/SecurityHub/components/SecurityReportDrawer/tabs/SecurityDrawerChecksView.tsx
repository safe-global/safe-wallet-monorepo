import type { ReactElement, ReactNode } from 'react'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { ScoreGauge } from '@views/features/spaces/components/SecurityHub/components/WorkspaceHealthCard/WorkspaceGauge'

export type SecurityDrawerChecksViewProps = {
  isLoading: boolean
  /** Score summary card data; omitted when there is no score to show. */
  header?: { score: number; color: string }
  issueCount?: number
  scannedAt?: string
  checksSection?: ReactNode
}

/**
 * "Checks" tab — a score summary card (gauge + issue count + scan time) followed by the
 * existing per-check rows.
 */
export const SecurityDrawerChecksView = ({
  isLoading,
  header,
  issueCount = 0,
  scannedAt,
  checksSection,
}: SecurityDrawerChecksViewProps): ReactElement => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    )
  }

  const title = issueCount === 0 ? 'Healthy' : `${issueCount} issue${maybePlural(issueCount)} found`

  return (
    <div className="flex flex-col gap-6">
      {header && (
        // eslint-disable-next-line no-restricted-syntax -- fixed 88px score-summary row: horizontal layout, tight gap-3/px-4 and a dark surface tint; bespoke, no matching variant
        <Card size="none" className="h-[88px] flex-row items-center gap-3 px-4 dark:bg-secondary">
          <ScoreGauge scorePct={header.score} color={header.color} size="small" />

          <div className="flex min-w-0 flex-col gap-1">
            <Typography variant="paragraph-bold">{title}</Typography>
            <Typography variant="paragraph-mini" color="muted">
              Scanned {scannedAt}
            </Typography>
          </div>
        </Card>
      )}

      {checksSection}
    </div>
  )
}
