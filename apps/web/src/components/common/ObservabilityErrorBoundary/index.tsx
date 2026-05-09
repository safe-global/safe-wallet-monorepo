import { Component, type ReactNode } from 'react'
import ErrorBoundary from '@/components/common/ErrorBoundary'

interface ObservabilityErrorBoundaryProps {
  children: ReactNode
  onError?: (error: Error, componentStack?: string) => void
  fallback?: ReactNode
}

interface ObservabilityErrorBoundaryState {
  hasError: boolean
  error: Error | null
  componentStack: string
}

class ObservabilityErrorBoundary extends Component<ObservabilityErrorBoundaryProps, ObservabilityErrorBoundaryState> {
  constructor(props: ObservabilityErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      componentStack: '',
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ObservabilityErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    const componentStack = errorInfo.componentStack || ''

    this.setState({
      componentStack,
    })

    if (this.props.onError) {
      this.props.onError(error, componentStack)
    }
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorBoundary error={this.state.error} componentStack={this.state.componentStack} />
    }

    return this.props.children
  }
}

export default ObservabilityErrorBoundary
