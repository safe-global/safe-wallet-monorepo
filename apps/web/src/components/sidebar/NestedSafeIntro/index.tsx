import { Box, Typography, Button } from '@mui/material'
import type { ReactElement } from 'react'

import NestedSafesIllustration from '@/public/images/sidebar/nested-safes.svg'
import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'

interface NestedSafeIntroProps {
  onReviewClick: () => void
}

export function NestedSafeIntro({ onReviewClick }: NestedSafeIntroProps): ReactElement {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
      <NestedSafesIllustration />

      <Typography variant="h6" fontWeight={700} mt={2}>
        Select Nested Safes
      </Typography>

      <Typography variant="body2" color="text.secondary" mt={1}>
        Nested Safes can include lookalike addresses.
      </Typography>

      <Typography variant="body2" color="text.secondary" mt={1}>
        Review and select the ones you recognize before adding them to your dashboard.
      </Typography>

      <Track {...NESTED_SAFE_EVENTS.REVIEW_NESTED_SAFES} label={NESTED_SAFE_LABELS.first_time}>
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
          onClick={onReviewClick}
          data-testid="review-nested-safes-button"
        >
          Review Nested Safes
        </Button>
      </Track>
    </Box>
  )
}
