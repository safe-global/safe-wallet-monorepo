import { useState, type ReactElement } from 'react'
import { Box, Typography, Stack, IconButton, Collapse } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { DeadlockCheckResult } from '@safe-global/utils/features/safe-shield/types'
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { SEVERITY_COLORS } from '@/features/safe-shield/constants'

const STATUS_TO_SEVERITY: Record<string, Severity> = {
  blocked: Severity.CRITICAL,
  warning: Severity.WARN,
  unknown: Severity.WARN,
}

const STATUS_TO_TITLE: Record<string, string> = {
  blocked: 'This setup creates a signing deadlock',
  warning: 'Nested signer safety could not be fully verified',
  unknown: 'Nested signer safety could not be fully verified',
}

const DeadlockAnalysisCard = ({
  result,
  loading,
}: {
  result?: DeadlockCheckResult
  loading?: boolean
}): ReactElement | null => {
  const [isOpen, setIsOpen] = useState(false)

  if (loading || !result || result.status === 'valid') {
    return null
  }

  const severity = STATUS_TO_SEVERITY[result.status]
  const title = STATUS_TO_TITLE[result.status]
  const borderColor = SEVERITY_COLORS[severity].main
  const description =
    result.status === 'unknown'
      ? 'We could not fetch all nested Safe owners and thresholds. Continuing may create an unexecutable setup.'
      : result.reason

  return (
    <Box data-testid="deadlock-analysis-card">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ p: 1.5, cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <SeverityIcon severity={severity} />
          <Typography variant="body2" color="primary.light">
            {title}
          </Typography>
        </Stack>

        <IconButton
          size="small"
          sx={{
            width: 16,
            height: 16,
            padding: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <KeyboardArrowDownIcon sx={{ width: 16, height: 16, color: 'text.secondary' }} />
        </IconButton>
      </Stack>

      <Collapse in={isOpen}>
        <Box sx={{ pt: 0.5, px: 1.5, pb: 2 }}>
          <Box bgcolor="background.main" borderRadius={0.5} overflow="hidden">
            <Box sx={{ borderLeft: `4px solid ${borderColor}`, p: 1.5 }}>
              <Typography variant="body2" color="primary.light">
                {description}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  )
}

export default DeadlockAnalysisCard
