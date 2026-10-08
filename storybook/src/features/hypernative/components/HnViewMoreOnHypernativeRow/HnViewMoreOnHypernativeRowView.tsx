import type { ReactElement } from 'react'
import { ChevronRight } from 'lucide-react'
import { Alert, AlertSeverityIcon } from '@/components/ui/alert'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'

export type HnViewMoreOnHypernativeRowViewProps = {
  overflowCount: number
  assessmentUrl: string
  onClick: () => void
}

export const HnViewMoreOnHypernativeRowView = ({
  overflowCount,
  assessmentUrl,
  onClick,
}: HnViewMoreOnHypernativeRowViewProps): ReactElement => {
  return (
    <Link
      href={assessmentUrl}
      target="_blank"
      rel="noopener noreferrer"
      variant="inherit"
      onClick={onClick}
      className="block text-[var(--color-text-primary)] no-underline hover:no-underline"
    >
      <Alert variant="warning" outlined={false} className="flex items-center gap-2 px-2 py-0">
        <AlertSeverityIcon variant="warning" />
        <div className="flex items-center justify-center rounded-lg bg-[var(--color-warning-light)] px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-[var(--color-warning-dark)]">
          +{overflowCount}
        </div>
        <div className="flex flex-1 flex-col">
          <Typography variant="paragraph-small">More issues found</Typography>
          <Typography variant="paragraph-mini" className="text-[var(--color-text-secondary)]">
            View full report on Hypernative
          </Typography>
        </div>
        <ChevronRight className="size-4 text-[var(--color-text-secondary)]" />
      </Alert>
    </Link>
  )
}
