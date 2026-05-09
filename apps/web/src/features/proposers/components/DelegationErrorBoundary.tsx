import { Component, type ReactElement, type ReactNode } from 'react'
import { Box, Button, Typography } from '@mui/material'

type DelegationErrorBoundaryProps = {
  children: ReactNode
  fallbackMessage?: string
  onRetry?: () => void
}

type DelegationErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

class DelegationErrorBoundary extends Component<DelegationErrorBoundaryProps, DelegationErrorBoundaryState> {
  constructor(props: DelegationErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): DelegationErrorBoundaryState {
    return { hasError: true, error }
  }

  handleRetry = (): void => {
    this.props.onRetry?.()
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <DelegationFallback
          error={this.state.error}
          fallbackMessage={this.props.fallbackMessage}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

function DelegationFallback({
  error,
  fallbackMessage,
  onRetry,
}: {
  error: Error
  fallbackMessage?: string
  onRetry: () => void
}): ReactElement {
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
      <Button size="small" variant="outlined" color="error" onClick={onRetry}>
        Try again
      </Button>
    </Box>
  )
}

export default DelegationErrorBoundary
