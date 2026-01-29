'use client'

import { useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { logError, Errors } from '@/services/exceptions'
import type { FeatureHandle, FeatureImplementation } from './types'

/**
 * Meta properties added to feature objects.
 * Prefixed with $ to avoid conflicts with feature exports.
 */
interface FeatureMeta {
  /** True while feature code is loading */
  $isLoading: boolean
  /** True if feature flag is disabled */
  $isDisabled: boolean
  /** True when feature is loaded and ready to use */
  $isReady: boolean
  /** Error if loading failed */
  $error: Error | undefined
}

/**
 * Creates a proxy that provides automatic stubs based on naming conventions.
 * - PascalCase → component returning null
 * - useSomething → undefined (hooks not stubbed - see Hooks Pattern in docs)
 * - camelCase → undefined (will throw if called, helping catch missing $isReady checks)
 */
function createStubProxy<T extends FeatureImplementation>(meta: FeatureMeta): T & FeatureMeta {
  const stubCache = new Map<string | symbol, unknown>()

  return new Proxy({} as T & FeatureMeta, {
    get(_, prop) {
      // Return meta properties directly
      if (prop === '$isLoading') return meta.$isLoading
      if (prop === '$isDisabled') return meta.$isDisabled
      if (prop === '$isReady') return meta.$isReady
      if (prop === '$error') return meta.$error

      // Return cached stub if exists
      if (stubCache.has(prop)) {
        return stubCache.get(prop)
      }

      // Create stub based on naming convention
      const name = String(prop)
      let stub: unknown

      if (name[0] === name[0].toUpperCase() && !name.startsWith('use')) {
        // Component stub - renders null
        stub = () => null
      } else {
        // Hooks and services - undefined (no stub)
        // Hooks: undefined when not ready (component must not mount until ready)
        // Services: undefined when not ready (will throw if called, catching missing $isReady checks)
        stub = undefined
      }

      stubCache.set(prop, stub)
      return stub
    },
  })
}

/**
 * Hook to load a feature lazily based on its handle.
 *
 * ALWAYS returns an object - never null or undefined. When the feature is
 * loading or disabled, returns a Proxy with automatic stubs based on naming:
 * - PascalCase → component returning null
 * - useSomething → undefined (hooks not stubbed - component must not mount until ready)
 * - camelCase → undefined (will throw if called without checking $isReady)
 *
 * @param handle - The feature handle with name, useIsEnabled, and load function.
 * @returns Feature object with meta properties ($isLoading, $isDisabled, $isReady, $error)
 *
 * @example
 * ```typescript
 * // Components can render before ready (stub renders null)
 * const feature = useLoadFeature(MyFeature)
 * return <feature.MyComponent />  // Renders null when not ready
 * ```
 *
 * @example
 * ```typescript
 * // For hooks, component must not mount until ready:
 * function Parent() {
 *   const feature = useLoadFeature(MyFeature)
 *   if (!feature.$isReady) return <Skeleton />
 *   return <ChildThatUsesHooks />
 * }
 *
 * function ChildThatUsesHooks() {
 *   const feature = useLoadFeature(MyFeature)
 *   // Safe - only mounts when ready, so useMyHook is always defined
 *   const data = feature.useMyHook()
 *   return <div>{data}</div>
 * }
 * ```
 *
 * @example
 * ```typescript
 * // For services, check $isReady first:
 * const feature = useLoadFeature(MyFeature)
 *
 * if (feature.$isReady) {
 *   feature.myService()  // Safe to call
 * }
 * // feature.myService() without check will throw (undefined is not a function)
 * ```
 */
export function useLoadFeature<T extends FeatureImplementation>(
  handle: FeatureHandle<T>,
): T & { name: string; useIsEnabled: () => boolean | undefined } & FeatureMeta {
  type LoadedFeature = T & { name: string; useIsEnabled: () => boolean | undefined }

  // Check feature flag (must be called unconditionally as it's a hook)
  const isEnabled = handle.useIsEnabled()

  // Load feature when enabled
  const [feature, error, loading] = useAsync(
    () => {
      if (isEnabled !== true) return
      return handle.load().then(
        (module) =>
          ({
            name: handle.name,
            useIsEnabled: handle.useIsEnabled,
            ...module.default,
          }) as LoadedFeature,
      )
    },
    [isEnabled, handle],
    false,
  )

  // Log errors for debugging
  if (error) {
    logError(Errors._906, error)
  }

  // Compute meta state
  const $isDisabled = isEnabled === false
  const $isLoading = isEnabled === undefined || loading
  const $isReady = isEnabled === true && !loading && !!feature
  const $error = error

  // Return feature with meta, or stub proxy
  return useMemo(() => {
    if ($isReady && feature) {
      // Feature loaded - return real implementation with meta
      return {
        ...feature,
        $isLoading: false,
        $isDisabled: false,
        $isReady: true,
        $error: undefined,
      } as LoadedFeature & FeatureMeta
    }

    // Not ready - return stub proxy
    return createStubProxy<T>({
      $isLoading,
      $isDisabled,
      $isReady: false,
      $error,
    }) as LoadedFeature & FeatureMeta
  }, [$isReady, $isLoading, $isDisabled, $error, feature])
}
