import type { ReactElement } from 'react'
import { Alert, Box, Link, Stack, Typography } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
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
      underline="none"
      onClick={() => trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_FULL_REPORT_CLICKED)}
      sx={{ display: 'block', color: 'text.primary' }}
    >
      <Alert
        severity="warning"
        sx={{ py: 0, px: 1 }}
        icon={
          <Box p={0}>
            <Box
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                px: 0.75,
                py: 0.25,
                borderRadius: 2,
                bgcolor: 'warning.light',
                color: 'warning.dark',
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              +{overflowCount}
            </Box>
          </Box>
        }
        action={
          <Box pr={1} pt={1}>
            <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary', alignSelf: 'center' }} />
          </Box>
        }
      >
        <Stack gap={0} p={0}>
          <Typography variant="body2">More issues found</Typography>
          <Typography variant="caption" color="text.secondary">
            View full report on Hypernative
          </Typography>
        </Stack>
      </Alert>
    </Link>
  )
}
