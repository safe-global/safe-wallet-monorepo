import { Box, Typography } from '@mui/material'
import type { ReactElement, ReactNode } from 'react'

export function SimilarityGroupContainer({ children }: { children: ReactNode }): ReactElement {
  return (
    <Box
      sx={{
        my: 0.5,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'warning.light',
        overflow: 'hidden',
      }}
    >
      {/* Warning header */}
      <Box sx={{ px: 1.5, py: 0.75, backgroundColor: 'warning.background' }}>
        <Typography variant="caption" fontWeight={500} color="warning.main">
          Similar addresses - verify carefully
        </Typography>
      </Box>

      {/* Grouped items */}
      <Box sx={{ backgroundColor: 'background.paper', p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {children}
      </Box>
    </Box>
  )
}
