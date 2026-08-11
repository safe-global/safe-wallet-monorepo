import type { ReactElement } from 'react'
import { ChevronRight } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { trackEvent } from '@/services/analytics'
import { HYPERNATIVE_EVENTS } from '@/services/analytics/events/hypernative'

type HnViewMoreOnHypernativeRowProps = {
  overflowCount: number
  assessmentUrl: string | null
}

/**
 * Overflow row shown inside HnAnalysisGroupCard when more findings exist than
 * the visible cap. Deep-links to the full report on Hypernative using the
 * same URL pattern as the queued-tx "View details" link.
 */
export const HnViewMoreOnHypernativeRow = ({
  overflowCount,
  assessmentUrl,
}: HnViewMoreOnHypernativeRowProps): ReactElement | null => {
  if (overflowCount <= 0 || !assessmentUrl) return null

  return (
    <Link
      href={assessmentUrl}
      target="_blank"
      rel="noopener noreferrer"
      variant="inherit"
      onClick={() => trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_FULL_REPORT_CLICKED)}
      className="block text-[var(--color-text-primary)] no-underline hover:no-underline"
    >
      <Alert variant="warning" className="flex items-center gap-2 px-2 py-0">
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
