import { Component, type ReactNode } from 'react'
import { DelegationErrorBoundaryView } from '@views/features/proposers/components/DelegationErrorBoundaryView'

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
        <DelegationErrorBoundaryView
          errorMessage={this.state.error.message}
          fallbackMessage={this.props.fallbackMessage}
          showErrorDetails={process.env.NODE_ENV !== 'production'}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

export default DelegationErrorBoundary
