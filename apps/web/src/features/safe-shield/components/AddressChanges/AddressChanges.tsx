import { Box, Typography } from '@mui/material'
import type { MasterCopyChangeThreatAnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import React from 'react'

interface AddressChangesProps {
  result: MasterCopyChangeThreatAnalysisResult
}

export const AddressChanges = ({ result }: AddressChangesProps) => {
  if (!result.before || !result.after) {
    return null
  }

  const items = [
    {
      label: 'CURRENT MASTERCOPY:',
      value: result.before,
    },
    {
      label: 'NEW MASTERCOPY:',
      value: result.after,
    },
  ]

  return items.map((item, index) => (
    <Box
      padding="8px"
      bgcolor="background.paper"
      gap={1}
      display="flex"
      key={`${item.value}-${index}`}
      flexDirection="column"
      borderRadius="4px"
      overflow="hidden"
    >
      <Typography letterSpacing="1px" fontSize="12px" color="text.secondary">
        {item.label}
      </Typography>

      <Typography variant="body2" sx={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
        {item.value}
      </Typography>
    </Box>
  ))
}
