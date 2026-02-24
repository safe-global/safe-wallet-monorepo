import type { ReactElement, ReactNode } from 'react'
import { ErrorBoundary } from '@sentry/react'
import { Box, Button, Typography } from '@mui/material'

type FallbackProps = {
  error: Error
  resetError: () => void
  fallbackMessage?: string
  onRetry?: () => void
}

type DelegationErrorBoundaryProps = {
  children: ReactNode
  fallbackMessage?: string
  onRetry?: () => void
}

function DelegationFallback({ error, resetError, fallbackMessage, onRetry }: FallbackProps): ReactElement {
  function handleRetry(): void {
    onRetry?.()
    resetError()
  }

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'var(--color-error-background)',
        borderRadius: 1,
        border: '1px solid var(--color-error-main)',
      }}
    >
      <Typography variant="body2" color="error.main" gutterBottom>
        {fallbackMessage || 'Something went wrong loading this content.'}
      </Typography>
      {process.env.NODE_ENV !== 'production' && (
        <Typography variant="caption" color="text.secondary" component="pre" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
          {error.message}
        </Typography>
      )}
      <Button size="small" variant="outlined" color="error" onClick={handleRetry}>
        Try again
      </Button>
    </Box>
  )
}

function DelegationErrorBoundary({ children, fallbackMessage, onRetry }: DelegationErrorBoundaryProps): ReactElement {
  return (
    <ErrorBoundary
      fallback={(props) => <DelegationFallback {...props} fallbackMessage={fallbackMessage} onRetry={onRetry} />}
    >
      {children}
    </ErrorBoundary>
  )
}

export default DelegationErrorBoundary
