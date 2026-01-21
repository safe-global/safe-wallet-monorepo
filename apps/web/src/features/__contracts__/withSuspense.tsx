import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'
import { Suspense, memo } from 'react'

/**
 * Wraps a lazy-loaded component with Suspense.
 * Use this in feature handles to avoid consumers needing to wrap components themselves.
 *
 * @param LazyComponent - A React.lazy() component
 * @param fallback - Optional fallback UI while loading (defaults to null)
 * @returns A regular component that includes Suspense internally
 *
 * @example
 * // In handle.ts:
 * import { withSuspense } from '@/features/__contracts__'
 *
 * export const myFeatureHandle = {
 *   components: {
 *     Widget: withSuspense(lazy(() => import('./__internal__/components/Widget'))),
 *   },
 * }
 *
 * // Consumer can now use directly without Suspense:
 * const feature = useFeature('my-feature')
 * return <feature.components.Widget />
 */
export function withSuspense<P extends object>(
  LazyComponent: LazyExoticComponent<ComponentType<P>>,
  fallback: ReactNode = null,
): ComponentType<P> {
  const WrappedComponent = memo(function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )
  })

  // Preserve display name for debugging
  const lazyDisplayName = (LazyComponent as unknown as { displayName?: string }).displayName
  WrappedComponent.displayName = `withSuspense(${lazyDisplayName || 'LazyComponent'})`

  return WrappedComponent
}
