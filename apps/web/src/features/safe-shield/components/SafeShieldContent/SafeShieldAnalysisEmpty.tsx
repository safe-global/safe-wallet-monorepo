import { type ReactElement } from 'react'
import { Typography } from '@mui/material'

export const SafeShieldAnalysisEmpty = (): ReactElement => (
  <Typography padding={2} variant="body2" color="text.secondary" textAlign="center">
    Transaction details will be automatically scanned for potential risks and will appear here.
  </Typography>
)
