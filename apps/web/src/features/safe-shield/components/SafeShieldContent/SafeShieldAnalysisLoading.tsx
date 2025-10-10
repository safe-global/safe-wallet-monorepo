import { type ReactElement } from 'react'
import { Typography, Stack, CircularProgress } from '@mui/material'

export const SafeShieldAnalysisLoading = (): ReactElement => (
  <Stack padding={2} alignItems="center" justifyContent="center" py={3} gap={2}>
    <CircularProgress size={24} />
    <Typography variant="body2" color="text.secondary">
      Analyzing transaction security...
    </Typography>
  </Stack>
)
