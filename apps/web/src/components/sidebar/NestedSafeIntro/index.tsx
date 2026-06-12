import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { ReactElement } from 'react'

import NestedSafesIllustration from '@/public/images/sidebar/nested-safes.svg'
import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'

interface NestedSafeIntroProps {
  onReviewClick: () => void
}

export function NestedSafeIntro({ onReviewClick }: NestedSafeIntroProps): ReactElement {
  return (
    <div className="flex flex-col items-center text-center">
      <NestedSafesIllustration />

      <Typography variant="h4" className="mt-4">
        Select Nested Safes
      </Typography>

      <Typography variant="paragraph-small" color="muted" className="mt-2">
        Nested Safes can include lookalike addresses.
      </Typography>

      <Typography variant="paragraph-small" color="muted" className="mt-2">
        Review and select the ones you recognize before adding them to your dashboard.
      </Typography>

      <Track {...NESTED_SAFE_EVENTS.REVIEW_NESTED_SAFES} label={NESTED_SAFE_LABELS.first_time}>
        <Button className="mt-6 w-full" onClick={onReviewClick} data-testid="review-nested-safes-button">
          Review Nested Safes
        </Button>
      </Track>
    </div>
  )
}
