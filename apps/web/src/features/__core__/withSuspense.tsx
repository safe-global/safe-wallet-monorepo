import type { ComponentType, LazyExoticComponent, ReactNode, ErrorInfo } from 'react'
import { Suspense, memo, Component } from 'react'

/**
 * Options for withSuspense wrapper.
 */
type WithSuspenseOptions = {
  /** Fallback UI while loading (defaults to null) */
  fallback?: ReactNode
  /** Error fallback - static ReactNode or function receiving the error */
  errorFallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode)
}

/**
 * Error boundary component for catching render errors in lazy-loaded components.
 */
class SuspenseErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode) },
  { error: Error | null; errorInfo: ErrorInfo | null }
> {
  constructor(props: {
    children: ReactNode
    fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode)
  }) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error('Feature component error:', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      const { fallback } = this.props
      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.state.errorInfo!)
      }
      return fallback ?? null
    }
    return this.props.children
  }
}

