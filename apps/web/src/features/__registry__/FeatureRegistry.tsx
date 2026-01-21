'use client'

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { FeatureHandle, FeatureContract, FeatureMap, FeatureImplementation } from '@/features/__contracts__'

/**
 * Interface for the feature registry context value.
 * Provides methods to register, unregister, and lookup feature handles.
 */
interface FeatureRegistryContextValue {
  /** Register a feature handle */
  register: <T extends FeatureImplementation>(handle: FeatureHandle<T>) => () => void
  /** Get a feature handle by name */
  getHandle: <T extends FeatureImplementation>(name: string) => FeatureHandle<T> | undefined
  /** Get all registered handles */
  getAllHandles: () => ReadonlyMap<string, FeatureHandle>
  /** Check if a feature is registered */
  has: (name: string) => boolean
  /** Subscribe to registry changes */
  subscribe: (callback: () => void) => () => void
  /** Get cached loaded feature (internal use) */
  getLoaded: <T extends FeatureContract>(name: string) => T | undefined
  /** Set cached loaded feature (internal use) */
  setLoaded: <T extends FeatureContract>(name: string, feature: T) => void
  /** Check if a feature is currently being loaded (internal use) */
  isLoading: (name: string) => boolean
  /** Mark a feature as loading (internal use) - returns true if load should proceed */
  startLoading: (name: string) => boolean
}

const FeatureRegistryContext = createContext<FeatureRegistryContextValue | null>(null)

/**
 * Provider component that creates and provides the feature registry.
 * Should be placed near the root of the application.
 */
interface FeatureRegistryProviderProps {
  children: ReactNode
  /** Feature handles to register at startup (minimal, tiny) */
  initialFeatures?: FeatureHandle[]
}

export function FeatureRegistryProvider({ children, initialFeatures = [] }: FeatureRegistryProviderProps) {
  // Registry of minimal handles
  const handlesRef = useRef(new Map<string, FeatureHandle>())
  // Cache of loaded features
  const loadedRef = useRef(new Map<string, FeatureContract>())
  // Set of features currently being loaded (prevents concurrent loads)
  const loadingRef = useRef(new Set<string>())
  // Subscribers for registry changes
  const subscribersRef = useRef(new Set<() => void>())

  // Register initial handles once on mount
  const initializedRef = useRef(false)
  if (!initializedRef.current) {
    initialFeatures.forEach((handle) => {
      handlesRef.current.set(handle.name, handle)
    })
    initializedRef.current = true
  }

  const notifySubscribers = useCallback(() => {
    subscribersRef.current.forEach((callback) => callback())
  }, [])

  const register = useCallback(
    <T extends FeatureImplementation>(handle: FeatureHandle<T>): (() => void) => {
      if (handlesRef.current.has(handle.name)) {
        console.warn(`Feature "${handle.name}" is already registered. Replacing.`)
      }

      handlesRef.current.set(handle.name, handle)
      notifySubscribers()

      return () => {
        handlesRef.current.delete(handle.name)
        loadedRef.current.delete(handle.name)
        notifySubscribers()
      }
    },
    [notifySubscribers],
  )

  const getHandle = useCallback(<T extends FeatureImplementation>(name: string): FeatureHandle<T> | undefined => {
    return handlesRef.current.get(name) as FeatureHandle<T> | undefined
  }, [])

  const getAllHandles = useCallback((): ReadonlyMap<string, FeatureHandle> => {
    return handlesRef.current
  }, [])

  const has = useCallback((name: string): boolean => {
    return handlesRef.current.has(name)
  }, [])

  const subscribe = useCallback((callback: () => void): (() => void) => {
    subscribersRef.current.add(callback)
    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  const getLoaded = useCallback(<T extends FeatureContract>(name: string): T | undefined => {
    return loadedRef.current.get(name) as T | undefined
  }, [])

  const setLoaded = useCallback(
    <T extends FeatureContract>(name: string, feature: T) => {
      loadedRef.current.set(name, feature)
      loadingRef.current.delete(name)
      notifySubscribers()
    },
    [notifySubscribers],
  )

  const isLoading = useCallback((name: string): boolean => {
    return loadingRef.current.has(name)
  }, [])

  const startLoading = useCallback((name: string): boolean => {
    // Returns true if load should proceed (wasn't already loading)
    if (loadingRef.current.has(name)) {
      return false
    }
    loadingRef.current.add(name)
    return true
  }, [])

  const value = useMemo(
    () => ({ register, getHandle, getAllHandles, has, subscribe, getLoaded, setLoaded, isLoading, startLoading }),
    [register, getHandle, getAllHandles, has, subscribe, getLoaded, setLoaded, isLoading, startLoading],
  )

  return <FeatureRegistryContext.Provider value={value}>{children}</FeatureRegistryContext.Provider>
}

/**
 * Hook to access the feature registry directly.
 * Prefer using `useFeature` for most cases.
 *
 * @throws Error if used outside of FeatureRegistryProvider
 */
export function useFeatureRegistry(): FeatureRegistryContextValue {
  const context = useContext(FeatureRegistryContext)
  if (!context) {
    throw new Error('useFeatureRegistry must be used within a FeatureRegistryProvider')
  }
  return context
}

/**
 * Hook to get a fully loaded feature from the registry.
 *
 * This handles the complete loading flow:
 * 1. Gets the minimal handle from registry
 * 2. Checks if the feature flag is enabled
 * 3. Lazily loads the full implementation when enabled
 * 4. Caches the loaded feature for subsequent calls
 *
 * @param name - The feature name to look up (type is inferred from FeatureMap)
 * @returns The full feature contract, or null if not available/enabled/loading
 *
 * @example
 * function MyComponent() {
 *   const walletConnect = useFeature('walletconnect')
 *
 *   // null means: not registered, disabled, or still loading
 *   if (!walletConnect) return null
 *
 *   // Feature is loaded - safe to use
 *   return <walletConnect.components.WalletConnectWidget />
 * }
 */
// Overload for features registered in FeatureMap (type is inferred)
export function useFeature<K extends keyof FeatureMap>(name: K): FeatureMap[K] | null
// Overload for features not yet in FeatureMap (explicit type required)
export function useFeature<T extends FeatureContract>(name: string): T | null
// Implementation
export function useFeature<T extends FeatureContract>(name: string): T | null {
  // Get context directly to avoid throwing during SSR prerendering
  const context = useContext(FeatureRegistryContext)

  // Get the minimal handle from registry
  const handle = useSyncExternalStore(
    context?.subscribe ?? (() => () => {}),
    () => context?.getHandle(name),
    () => context?.getHandle(name),
  )

  // Check feature flag (must be called unconditionally as it's a hook)
  const isEnabled = handle?.useIsEnabled()

  // Get cached loaded feature
  const cachedFeature = useSyncExternalStore(
    context?.subscribe ?? (() => () => {}),
    () => context?.getLoaded<T>(name),
    () => context?.getLoaded<T>(name),
  )

  // Load the feature when enabled and not already loaded
  useEffect(() => {
    if (!context || !handle || isEnabled !== true || cachedFeature) {
      return
    }

    // Use centralized loading tracking to prevent concurrent loads
    if (!context.startLoading(name)) {
      return // Already loading
    }

    handle.load().then((module) => {
      // Combine handle info with loaded implementation
      const fullFeature: T = {
        name: handle.name,
        useIsEnabled: handle.useIsEnabled,
        ...module.default,
      } as T

      context.setLoaded(name, fullFeature)
    })
  }, [context, handle, isEnabled, cachedFeature, name])

  // Return null if not available, disabled, or still loading
  if (!context || !handle || isEnabled !== true || !cachedFeature) {
    return null
  }

  return cachedFeature
}

/**
 * Hook to check if a feature is registered (handle exists).
 *
 * @param name - The feature name to check
 * @returns true if the feature handle is registered
 */
export function useHasFeature(name: string): boolean {
  const context = useContext(FeatureRegistryContext)

  return useSyncExternalStore(
    context?.subscribe ?? (() => () => {}),
    () => context?.has(name) ?? false,
    () => context?.has(name) ?? false,
  )
}

/**
 * Hook to register a feature handle with the registry.
 * Automatically unregisters when the component unmounts.
 *
 * @param handle - The feature handle to register
 */
export function useRegisterFeature<T extends FeatureImplementation>(handle: FeatureHandle<T>): void {
  const registry = useFeatureRegistry()

  useEffect(() => {
    return registry.register(handle)
  }, [registry, handle])
}

/**
 * Hook to get all registered feature handles.
 *
 * @returns Map of feature names to handles
 */
export function useAllFeatures(): ReadonlyMap<string, FeatureHandle> {
  const context = useContext(FeatureRegistryContext)

  return useSyncExternalStore(
    context?.subscribe ?? (() => () => {}),
    () => context?.getAllHandles() ?? new Map(),
    () => context?.getAllHandles() ?? new Map(),
  )
}
