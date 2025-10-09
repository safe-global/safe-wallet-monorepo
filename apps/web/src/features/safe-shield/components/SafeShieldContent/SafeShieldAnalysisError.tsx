import { type ReactElement } from 'react'
import { Typography, Alert, Box } from '@mui/material'

export const SafeShieldAnalysisError = ({ error }: { error: Error }): ReactElement => (
  <Box padding={2}>
    <Alert severity="warning">
      <Typography variant="body2">
        Unable to perform security analysis: {error.message || 'Unknown error'}
      </Typography>
    </Alert>
  </Box>
)