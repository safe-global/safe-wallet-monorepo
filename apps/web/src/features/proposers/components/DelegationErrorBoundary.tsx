import { Component, type ReactElement, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

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
    <div className="rounded-lg border border-[var(--color-error-main)] bg-[var(--color-error-background)] p-4">
      <Typography variant="paragraph-small" className="mb-1 block text-destructive">
        {fallbackMessage || 'Something went wrong loading this content.'}
      </Typography>
      {process.env.NODE_ENV !== 'production' && (
        <Typography variant="paragraph-mini" color="muted" className="mb-2 block whitespace-pre-wrap font-mono">
          {error.message}
        </Typography>
      )}
      <Button size="sm" variant="outline" className="text-destructive" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

export default DelegationErrorBoundary
