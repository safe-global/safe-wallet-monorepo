import { type ReactElement, useMemo, useState } from 'react'
import { Box, Typography, Stack, IconButton, Collapse } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { type AddressAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { isAddressChange, mapVisibleAnalysisResults } from '@safe-global/utils/features/safe-shield/utils'
import { SeverityIcon } from '../SeverityIcon'
import { AnalysisIssuesDisplay } from '../AnalysisIssuesDisplay'
import { AddressChanges } from '../AddressChanges'
import { AnalysisGroupCardItem } from './AnalysisGroupCardItem'

export const AnalysisGroupCard = ({
  data,
}: {
  data: { [address: string]: AddressAnalysisResults }
}): ReactElement | null => {
  const [isOpen, setIsOpen] = useState(false)

  const visibleResults = useMemo(() => mapVisibleAnalysisResults(Object.values(data || [])), [data])
  const primaryResult = useMemo(() => {
    return visibleResults[0]
  }, [visibleResults])

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
            {visibleResults.map((result, index) => (
              <AnalysisGroupCardItem key={index} severity={result.severity} description={result.description}>
                <AnalysisIssuesDisplay result={result} />

                {isAddressChange(result) && <AddressChanges result={result} />}
              </AnalysisGroupCardItem>
            ))}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  )
}
