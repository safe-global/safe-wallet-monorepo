import type { ReactNode, ErrorInfo } from 'react'
import React from 'react'

type SafeAppsErrorBoundaryProps = {
  children?: ReactNode
  render: () => ReactNode
}

type SafeAppsErrorBoundaryState = {
  hasError: boolean
  error?: Error
}

class SafeAppsErrorBoundary extends React.Component<SafeAppsErrorBoundaryProps, SafeAppsErrorBoundaryState> {
  public state: SafeAppsErrorBoundaryState = {
    hasError: false,
  }

  constructor(props: SafeAppsErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error:', error, errorInfo)
  }

  public static getDerivedStateFromError(error: Error): SafeAppsErrorBoundaryState {
    return { hasError: true, error }
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.render()
    }

    return this.props.children
  }
}

export default SafeAppsErrorBoundary
