import { type ReactElement, useMemo, useState } from 'react'
import { Box, Typography, Stack, IconButton, Collapse } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { ContractStatus, type GroupedAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { mapVisibleAnalysisResults } from '@safe-global/utils/features/safe-shield/utils'
import { SeverityIcon } from '../SeverityIcon'
import { AnalysisGroupCardItem } from './AnalysisGroupCardItem'
import { DelegateCallCardItem } from './DelegateCallCardItem'

export const AnalysisGroupCard = ({
  data,
}: {
  data: { [address: string]: GroupedAnalysisResults }
}): ReactElement | null => {
  const [isOpen, setIsOpen] = useState(false)

  const visibleResults = useMemo(() => mapVisibleAnalysisResults(data), [data])
  const primaryResult = useMemo(() => visibleResults[0], [visibleResults])

  if (!visibleResults.length) {
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
          <SeverityIcon severity={primaryResult.severity} />
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
        <Box sx={{ padding: '4px 12px 16px' }}>
          <Stack gap={2}>
            {visibleResults.map((result, index) => {
              const isPrimary = index === 0

              if (result.type === ContractStatus.UNEXPECTED_DELEGATECALL) {
                return <DelegateCallCardItem key={index} result={result} isPrimary={isPrimary} />
              }

              return <AnalysisGroupCardItem key={index} result={result} isPrimary={isPrimary} />
            })}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  )
}
