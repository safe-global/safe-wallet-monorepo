'use client'

import { useMemo, useRef } from 'react'
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
 * The proxy is created once per hook instance and reads meta values from a ref,
 * so its reference stays stable while the feature is not ready.
 *
 * - PascalCase -> component returning null
 * - useSomething -> undefined (hooks not stubbed - see Hooks Pattern in docs)
 * - camelCase -> undefined (will throw if called, helping catch missing $isReady checks)
 */
function createStableStubProxy<T extends FeatureImplementation>(
  metaRef: React.RefObject<FeatureMeta>,
): T & FeatureMeta {
  const stubCache = new Map<string | symbol, unknown>()

  return new Proxy({} as T & FeatureMeta, {
    get(_, prop) {
      // Meta properties read from the ref — always fresh
      if (prop === '$isLoading') return metaRef.current.$isLoading
      if (prop === '$isDisabled') return metaRef.current.$isDisabled
      if (prop === '$isReady') return metaRef.current.$isReady
      if (prop === '$error') return metaRef.current.$error

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
        stub = undefined
      }

      stubCache.set(prop, stub)
      return stub
    },
  })
}

/** Derives FeatureMeta from the flag and async load state. */
function computeMeta(
  isEnabled: boolean | undefined,
  feature: unknown,
  loading: boolean,
  error: Error | undefined,
): FeatureMeta {
  return {
    $isDisabled: isEnabled === false,
    $isLoading: isEnabled === undefined || loading,
    $isReady: isEnabled === true && !loading && !!feature,
    $error: error,
  }
}

/**
 * Hook to load a feature lazily based on its handle.
 *
 * ALWAYS returns an object - never null or undefined. When the feature is
 * loading or disabled, returns a Proxy with automatic stubs based on naming:
 * - PascalCase -> component returning null
 * - useSomething -> undefined (hooks not stubbed - component must not mount until ready)
 * - camelCase -> undefined (will throw if called without checking $isReady)
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

  // Cache loaded feature in a ref — survives isEnabled flicker (e.g. chain switch
  // where the flag briefly becomes undefined then true again). Once a feature
  // module is loaded it never changes, so re-fetching is pure waste.
  const cachedFeatureRef = useRef<LoadedFeature | undefined>(undefined)

  // Load feature when enabled, or return from cache
  const [feature, error, loading] = useAsync(
    () => {
      if (isEnabled !== true) return

      // Already loaded? Return from cache — skip the import() entirely
      if (cachedFeatureRef.current) {
        return Promise.resolve(cachedFeatureRef.current)
      }

      return handle.load().then((module) => {
        const loaded = {
          name: handle.name,
          useIsEnabled: handle.useIsEnabled,
          ...module.default,
        } as LoadedFeature

        cachedFeatureRef.current = loaded
        return loaded
      })
    },
    [isEnabled, handle],
    false,
  )

  // Log errors for debugging
  if (error) {
    logError(Errors._906, error)
  }

  const meta = computeMeta(isEnabled, feature, loading, error)

  // Stable proxy — created once per hook instance, reads meta from ref
  const metaRef = useRef<FeatureMeta>(meta)
  metaRef.current = meta

  const stubProxy = useMemo(() => createStableStubProxy<T>(metaRef), [])

  // Return feature with meta, or the stable stub proxy
  return useMemo(() => {
    if (meta.$isReady && feature) {
      return { ...feature, ...meta } as LoadedFeature & FeatureMeta
    }
    return stubProxy as unknown as LoadedFeature & FeatureMeta
  }, [meta.$isReady, feature, stubProxy, meta])
}
