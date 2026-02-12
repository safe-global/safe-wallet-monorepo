'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { logError, Errors } from '@/services/exceptions'
import type { FeatureHandle, FeatureImplementation } from './types'

/**
 * Meta properties added to feature objects.
 * Prefixed with $ to avoid conflicts with feature exports.
 */
interface FeatureMeta {
  /** True if feature flag is disabled */
  $isDisabled: boolean
  /** True when feature is loaded and ready to use */
  $isReady: boolean
  /** Error if loading failed */
  $error: Error | undefined
}

type LoadResult<T> = { feature: T } | { error: Error } | undefined

/** Extracts the feature from a load result, or undefined. */
function getFeature<T>(result: LoadResult<T>): T | undefined {
  return result && 'feature' in result ? result.feature : undefined
}

/** Extracts the error from a load result, or undefined. */
function getError<T>(result: LoadResult<T>): Error | undefined {
  return result && 'error' in result ? result.error : undefined
}

/** Coerces an unknown thrown value into an Error instance. */
function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err))
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
      if (prop === '$isDisabled') return metaRef.current.$isDisabled
      if (prop === '$isReady') return metaRef.current.$isReady
      if (prop === '$error') return metaRef.current.$error

      // Return cached stub if exists
      if (stubCache.has(prop)) {
        return stubCache.get(prop)
      }

      // Create stub based on naming convention
      const name = String(prop)
      const stub = name[0] >= 'A' && name[0] <= 'Z' ? () => null : undefined

      stubCache.set(prop, stub)
      return stub
    },
  })
}

/**
 * Hook to load a feature lazily based on its handle.
 *
 * ALWAYS returns an object - never null or undefined. When the feature is
 * not yet ready or disabled, returns a Proxy with automatic stubs based on naming:
 * - PascalCase -> component returning null
 * - useSomething -> undefined (hooks not stubbed - component must not mount until ready)
 * - camelCase -> undefined (will throw if called without checking $isReady)
 *
 * There is no intermediate "loading" state — the hook goes directly from not-ready
 * to ready in a single transition, minimizing re-renders.
 *
 * @param handle - The feature handle with name, useIsEnabled, and load function.
 * @returns Feature object with meta properties ($isDisabled, $isReady, $error)
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

  // Single state: the loaded feature or an error. No intermediate "loading" state —
  // we go directly from undefined to the loaded feature in one transition.
  const [loaded, setLoaded] = useState<LoadResult<LoadedFeature>>(() =>
    cachedFeatureRef.current ? { feature: cachedFeatureRef.current } : undefined,
  )

  useEffect(() => {
    if (isEnabled !== true) return

    // Already loaded? Ensure state reflects the cached feature (handles flicker recovery)
    if (cachedFeatureRef.current) {
      setLoaded({ feature: cachedFeatureRef.current })
      return
    }

    let cancelled = false

    handle.load().then(
      (module) => {
        if (cancelled) return

        const feature = {
          name: handle.name,
          useIsEnabled: handle.useIsEnabled,
          ...module.default,
        } as LoadedFeature

        cachedFeatureRef.current = feature
        setLoaded({ feature })
      },
      (err) => {
        if (cancelled) return
        logError(Errors._906, toError(err))
        setLoaded({ error: toError(err) })
      },
    )

    return () => {
      cancelled = true
    }
  }, [isEnabled, handle])

  // Derive meta from current state
  const feature = getFeature(loaded)
  const meta: FeatureMeta = {
    $isDisabled: isEnabled === false,
    $isReady: !!feature,
    $error: getError(loaded),
  }

  // Stable proxy — created once per hook instance, reads meta from ref
  const metaRef = useRef<FeatureMeta>(meta)
  metaRef.current = meta

  const stubProxy = useMemo(() => createStableStubProxy<T>(metaRef), [])

  // Return feature with meta, or the stable stub proxy
  return useMemo(() => {
    if (feature) {
      return { ...feature, ...meta } as LoadedFeature & FeatureMeta
    }
    return stubProxy as unknown as LoadedFeature & FeatureMeta
  }, [feature, stubProxy, meta])
}
