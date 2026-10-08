import type { ReactElement } from 'react'
import { trackEvent } from '@/services/analytics'
import { HYPERNATIVE_EVENTS } from '@/services/analytics/events/hypernative'
import { HnViewMoreOnHypernativeRowView } from '@views/features/hypernative/components/HnViewMoreOnHypernativeRow/HnViewMoreOnHypernativeRowView'

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
    <HnViewMoreOnHypernativeRowView
      overflowCount={overflowCount}
      assessmentUrl={assessmentUrl}
      onClick={() => trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_FULL_REPORT_CLICKED)}
    />
  )
}
