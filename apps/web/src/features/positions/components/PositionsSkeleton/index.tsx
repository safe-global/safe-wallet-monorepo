import React from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Skeleton, Stack, Typography, Box, Card, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import EnhancedTable, { type EnhancedTableProps } from '@/components/common/EnhancedTable'

const skeletonCells: EnhancedTableProps['rows'][0]['cells'] = {
  name: {
    rawValue: '0x0',
    content: (
      <Stack direction="row" alignItems="center" gap={1}>
        <Skeleton variant="rounded" width="32px" height="32px" />
        <Box>
          <Typography>
            <Skeleton width="100px" />
          </Typography>
          <Typography variant="body2">
            <Skeleton width="80px" />
          </Typography>
        </Box>
      </Stack>
    ),
  },
  balance: {
    rawValue: '0',
    content: (
      <Typography textAlign="right">
        <Skeleton width="60px" />
      </Typography>
    ),
  },
  value: {
    rawValue: '0',
    content: (
      <Box textAlign="right">
        <Typography>
          <Skeleton width="50px" />
        </Typography>
        <Typography variant="caption">
          <Skeleton width="40px" />
        </Typography>
      </Box>
    ),
  },
}

const skeletonRows: EnhancedTableProps['rows'] = Array(3).fill({ cells: skeletonCells })

const PositionsSkeleton = () => {
  return (
    <Stack gap={2}>
      <Card sx={{ border: 0 }}>
        <Accordion disableGutters elevation={0} variant="elevation" defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon fontSize="small" />}
            sx={{
              justifyContent: 'center',
              overflowX: 'auto',
              backgroundColor: 'transparent !important',
            }}
          >
            <Stack direction="row" alignItems="center" gap={2} width="100%">
              <Skeleton variant="rounded" width="40px" height="40px" />
              <Box flex={1}>
                <Typography>
                  <Skeleton width="120px" />
                </Typography>
                <Typography variant="body2">
                  <Skeleton width="80px" />
                </Typography>
              </Box>
              <Typography>
                <Skeleton width="60px" />
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box>
              <EnhancedTable
                rows={skeletonRows}
                headCells={[
                  { id: 'name', label: 'Loading...', width: '25%', disableSort: true },
                  { id: 'balance', label: 'Balance', width: '35%', align: 'right', disableSort: true },
                  { id: 'value', label: 'Value', width: '40%', align: 'right', disableSort: true },
                ]}
                compact
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </Card>
    </Stack>
  )
}

export default PositionsSkeleton
