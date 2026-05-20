import type { ReactElement } from 'react'
import { Box, Link, Stack, Typography } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { trackEvent } from '@/services/analytics'
import { HYPERNATIVE_EVENTS } from '@/services/analytics/events/hypernative'
import { SEVERITY_COLORS } from '@/features/safe-shield/constants'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          padding: '12px',
          borderRadius: '4px',
          bgcolor: SEVERITY_COLORS[Severity.WARN].background,
        }}
      >
        <WarningAmberRoundedIcon sx={{ color: SEVERITY_COLORS[Severity.WARN].main }} />
        <Stack flex={1} gap={0}>
          <Typography variant="body2" fontWeight={600}>
            +{overflowCount} More issues found
          </Typography>
          <Typography variant="caption" color="text.secondary">
            View full report on Hypernative
          </Typography>
        </Stack>
        <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
      </Box>
    </Link>
  )
}
