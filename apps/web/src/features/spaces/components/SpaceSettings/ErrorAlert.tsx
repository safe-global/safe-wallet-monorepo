import { Alert } from '@mui/material'
import type { ReactElement } from 'react'

const ErrorAlert = ({ error }: { error?: string }): ReactElement | null => {
  if (!error) {
    return null
  }

  return (
    <Alert severity="error" sx={{ mt: 2 }}>
      {error}
    </Alert>
  )
}

export default ErrorAlert
