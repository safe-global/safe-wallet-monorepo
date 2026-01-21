'use client'

import { useEffect, useSyncExternalStore } from 'react'
import type { FeatureHandle, FeatureImplementation, FeatureContract } from './types'

/**
 * Module-level cache for loaded features.
 * This cache is shared across all components using useFeature.
 */
const cache = new Map<string, FeatureContract>()

/**
 * Set of features currently being loaded (prevents concurrent loads).
 */
const loading = new Set<string>()

/**
 * Set of subscribers to notify when cache changes.
 */
const subscribers = new Set<() => void>()

/**
 * Subscribe to cache changes for useSyncExternalStore.
 */
function subscribe(callback: () => void): () => void {
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}

/**
 * Notify all subscribers that the cache has changed.
 */
function notifySubscribers(): void {
  subscribers.forEach((cb) => cb())
}

/**
 * Get a cached feature by name for useSyncExternalStore.
 */
function getSnapshot<T extends FeatureContract>(name: string): T | null {
  return (cache.get(name) as T) ?? null
}

/**
 * Hook to load a feature lazily based on its handle.
 *
 * This hook combines:
 * 1. Feature flag check (via handle.useIsEnabled)
 * 2. Lazy loading of the full implementation
 * 3. Module-level caching with useSyncExternalStore for reactivity
 *
 * @param handle - The feature handle with name, useIsEnabled, and load function
 * @returns The loaded feature contract, or null if not enabled/loaded
 *
 * @example
 * ```typescript
 * import { WalletConnectFeature } from '@/features/walletconnect'
 * import { useLoadFeature } from '@/features/__contracts__'
 *
 * function MyComponent() {
 *   const walletConnect = useLoadFeature(WalletConnectFeature)
 *   if (!walletConnect) return null
 *   return <walletConnect.components.WalletConnectWidget />
 * }
 * ```
 */
export function useLoadFeature<T extends FeatureImplementation>(
  handle: FeatureHandle<T>,
): (T & { name: string; useIsEnabled: () => boolean | undefined }) | null {
  // Check feature flag (must be called unconditionally as it's a hook)
  const isEnabled = handle.useIsEnabled()

  // Subscribe to cache changes for reactivity
  const cached = useSyncExternalStore(
    subscribe,
    () => getSnapshot<T & { name: string; useIsEnabled: () => boolean | undefined }>(handle.name),
    () => getSnapshot<T & { name: string; useIsEnabled: () => boolean | undefined }>(handle.name),
  )

  // Load the feature when enabled and not already loaded/loading
  useEffect(() => {
    // Only load if enabled, not cached, and not currently loading
    if (isEnabled !== true || cached || loading.has(handle.name)) {
      return
    }

    // Mark as loading to prevent concurrent loads
    loading.add(handle.name)

    handle.load().then((module) => {
      // Combine handle info with loaded implementation
      const fullFeature = {
        name: handle.name,
        useIsEnabled: handle.useIsEnabled,
        ...module.default,
      }

      // Cache the loaded feature
      cache.set(handle.name, fullFeature as FeatureContract)
      loading.delete(handle.name)

      // Notify subscribers to trigger re-render
      notifySubscribers()
    })
  }, [isEnabled, cached, handle])

  // Return null if not enabled or not yet loaded
  if (isEnabled !== true || !cached) {
    return null
  }

  return cached
}

/**
 * Clear the feature cache.
 * Useful for testing or hot module replacement.
 */
export function clearFeatureCache(): void {
  cache.clear()
  loading.clear()
  notifySubscribers()
}
