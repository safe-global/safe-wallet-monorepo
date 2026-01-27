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

/**
 * Wraps a lazy-loaded component with Suspense and optional ErrorBoundary.
 * Use this in feature handles to avoid consumers needing to wrap components themselves.
 *
 * @param LazyComponent - A React.lazy() component
 * @param options - Optional configuration object with fallback and errorFallback
 * @returns A regular component that includes Suspense (and optionally ErrorBoundary) internally
 *
 * @example
 * // Basic usage in handle.ts:
 * import { withSuspense } from '@/features/__core__'
 *
 * export const myFeatureHandle = {
 *   components: {
 *     Widget: withSuspense(lazy(() => import('./components/Widget'))),
 *   },
 * }
 *
 * @example
 * // With custom loading and error fallbacks:
 * export const myFeatureHandle = {
 *   components: {
 *     Widget: withSuspense(lazy(() => import('./components/Widget')), {
 *       fallback: <Spinner />,
 *       errorFallback: (error) => <ErrorDisplay message={error.message} />,
 *     }),
 *   },
 * }
 *
 * // Consumer can now use directly without Suspense:
 * const feature = useFeature('my-feature')
 * return <feature.components.Widget />
 */
export function withSuspense<P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  options: WithSuspenseOptions = {},
): ComponentType<P> {
  const { fallback = null, errorFallback } = options

  const WrappedComponent = memo(function SuspenseWrapper(props: P) {
    const content = (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )

    // Only wrap with ErrorBoundary if errorFallback is provided
    if (errorFallback !== undefined) {
      return <SuspenseErrorBoundary fallback={errorFallback}>{content}</SuspenseErrorBoundary>
    }

    return content
  })

  // Preserve display name for debugging
  const lazyDisplayName = (LazyComponent as unknown as { displayName?: string }).displayName
  WrappedComponent.displayName = `withSuspense(${lazyDisplayName || 'LazyComponent'})`

  return WrappedComponent
}
