import { Component, type ReactNode } from 'react'
import { TriangleAlert, RotateCw } from 'lucide-react'

type SafeCardsErrorBoundaryProps = {
  children: ReactNode
}

type SafeCardsErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

class SafeCardsErrorBoundary extends Component<SafeCardsErrorBoundaryProps, SafeCardsErrorBoundaryState> {
  constructor(props: SafeCardsErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): SafeCardsErrorBoundaryState {
    return { hasError: true, error }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center gap-3 rounded-3xl border-2 border-destructive/30 bg-destructive/5 px-6 py-4">
          <TriangleAlert className="size-5 shrink-0 text-destructive" />
          <span className="text-sm text-destructive">Failed to load Safe account.</span>
          <button
            onClick={this.handleRetry}
            className="ml-auto flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
            type="button"
          >
            <RotateCw className="size-3.5" />
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default SafeCardsErrorBoundary
