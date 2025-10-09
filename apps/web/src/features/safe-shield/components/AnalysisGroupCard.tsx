import { type ReactElement, useMemo, useState } from 'react'
import { Box, Typography, Stack, IconButton, Collapse, SvgIcon } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import type { AnalysisResult, Severity, AddressAnalysisResults } from '../types'
import { sortBySeverity } from '../utils'
import AlertIcon from '@/public/images/common/alert.svg'
import CheckIcon from '@/public/images/common/check.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import ErrorIcon from '@/public/images/common/error.svg'

const getSeverityIcon = (severity: Severity): ReactElement => {
  const iconProps = { width: 16, height: 16 }

  switch (severity) {
    case 'CRITICAL':
      return (
        <SvgIcon
          sx={{ ...iconProps, path: { fill: getSeverityColor(severity) }, rect: { fill: getSeverityColor(severity) } }}
          component={ErrorIcon}
          inheritViewBox
        />
      )
    case 'WARN':
      return (
        <SvgIcon
          sx={{ ...iconProps, path: { fill: getSeverityColor(severity) } }}
          component={AlertIcon}
          inheritViewBox
        />
      )
    case 'OK':
      return (
        <SvgIcon
          sx={{ ...iconProps, path: { fill: getSeverityColor(severity), stroke: getSeverityColor(severity) } }}
          component={CheckIcon}
          inheritViewBox
        />
      )
    default:
      return (
        <SvgIcon
          sx={{ ...iconProps, path: { fill: getSeverityColor(severity) }, rect: { fill: getSeverityColor(severity) } }}
          component={InfoIcon}
          inheritViewBox
        />
      )
  }
}

const getSeverityColor = (severity: Severity): string => {
  switch (severity) {
    case 'CRITICAL':
      return 'var(--color-error-main)'
    case 'WARN':
      return 'var(--color-warning-main)'
    case 'OK':
      return 'var(--color-success-main)'
    case 'INFO':
    default:
      return 'var(--color-info-main)'
  }
}

export const AnalysisGroupCard = ({
  data,
}: {
  data: {
    [address: string]: AddressAnalysisResults
  }
}): ReactElement | null => {
  const [isOpen, setIsOpen] = useState(false)

  // Collect all results from all addresses and groups
  const allResults = useMemo(() => {
    const results: AnalysisResult<any>[] = []
    for (const addressResults of Object.values(data)) {
      for (const groupResults of Object.values(addressResults)) {
        if (groupResults) {
          results.push(...groupResults)
        }
      }
    }
    return results
  }, [data])

  const sortedResults = useMemo(() => sortBySeverity(allResults), [allResults])
  const primaryResult = useMemo(() => sortedResults[0], [sortedResults])

  if (!allResults.length) {
    return null
  }

  return (
    <Box>
      {/* Card header - always visible */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ padding: '12px', cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          {getSeverityIcon(primaryResult.severity)}
          <Typography variant="body2" color="primary.light">
            {primaryResult.title}
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

      {/* Expanded content */}
      <Collapse in={isOpen}>
        <Box sx={{ padding: '0 12px 16px' }}>
          <Stack gap={2}>
            {sortedResults.map((result, index) => (
              <Box key={index} bgcolor="background.main" borderRadius="4px" overflow="hidden">
                <Box
                  sx={{
                    borderLeft: `4px solid ${getSeverityColor(result.severity)}`,
                    padding: '12px',
                  }}
                >
                  <Typography variant="body2" color="primary.light">
                    {result.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  )
}
