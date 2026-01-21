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
import type { FeatureContract } from '@/features/__contracts__'

/**
 * Interface for the feature registry context value.
 * Provides methods to register, unregister, and lookup features.
 */
interface FeatureRegistryContextValue {
  /**
   * Register a feature contract with the registry.
   * @returns Cleanup function to unregister the feature
   */
  register: <T extends FeatureContract>(contract: T) => () => void

  /**
   * Get a feature contract by name.
   * @returns The feature contract or undefined if not registered
   */
  get: <T extends FeatureContract>(name: string) => T | undefined

  /**
   * Get all registered feature contracts.
   * @returns Map of feature names to contracts
   */
  getAll: () => ReadonlyMap<string, FeatureContract>

  /**
   * Check if a feature is registered.
   */
  has: (name: string) => boolean

  /**
   * Subscribe to registry changes.
   * @returns Cleanup function to unsubscribe
   */
  subscribe: (callback: () => void) => () => void
}

const FeatureRegistryContext = createContext<FeatureRegistryContextValue | null>(null)

/**
 * Provider component that creates and provides the feature registry.
 * Should be placed near the root of the application.
 *
 * @example
 * function App() {
 *   return (
 *     <FeatureRegistryProvider>
 *       <MyApp />
 *     </FeatureRegistryProvider>
 *   )
 * }
 */
interface FeatureRegistryProviderProps {
  children: ReactNode
  /** Feature handles to register at startup (static, tiny) */
  initialFeatures?: FeatureContract[]
}

export function FeatureRegistryProvider({ children, initialFeatures = [] }: FeatureRegistryProviderProps) {
  // Use refs to maintain stable identity across renders
  const registryRef = useRef(new Map<string, FeatureContract>())
  const subscribersRef = useRef(new Set<() => void>())

  // Register initial features once on mount
  const initializedRef = useRef(false)
  if (!initializedRef.current) {
    initialFeatures.forEach((feature) => {
      registryRef.current.set(feature.name, feature)
    })
    initializedRef.current = true
  }

  // Notify all subscribers of registry changes
  const notifySubscribers = useCallback(() => {
    subscribersRef.current.forEach((callback) => callback())
  }, [])

  const register = useCallback(
    <T extends FeatureContract>(contract: T): (() => void) => {
      if (registryRef.current.has(contract.name)) {
        console.warn(`Feature "${contract.name}" is already registered. Replacing.`)
      }

      registryRef.current.set(contract.name, contract)
      notifySubscribers()

      // Return unregister function
      return () => {
        registryRef.current.delete(contract.name)
        notifySubscribers()
      }
    },
    [notifySubscribers],
  )

  const get = useCallback(<T extends FeatureContract>(name: string): T | undefined => {
    return registryRef.current.get(name) as T | undefined
  }, [])

  const getAll = useCallback((): ReadonlyMap<string, FeatureContract> => {
    return registryRef.current
  }, [])

  const has = useCallback((name: string): boolean => {
    return registryRef.current.has(name)
  }, [])

  const subscribe = useCallback((callback: () => void): (() => void) => {
    subscribersRef.current.add(callback)
    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  const value = useMemo(() => ({ register, get, getAll, has, subscribe }), [register, get, getAll, has, subscribe])

  return <FeatureRegistryContext.Provider value={value}>{children}</FeatureRegistryContext.Provider>
}

/**
 * Hook to access the feature registry directly.
 * Prefer using `useFeature` or `useRegisterFeature` for most cases.
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
 * Hook to get a specific feature's contract from the registry.
 * Returns null if the feature is not registered OR if its feature flag is disabled.
 *
 * This combines registry lookup + feature flag check in one step:
 * - Feature not registered → null
 * - Feature flag disabled → null
 * - Feature flag loading (undefined) → null
 * - Feature flag enabled → returns the feature contract
 *
 * @param name - The feature name to look up
 * @returns The feature contract, or null if not available/enabled
 *
 * @example
 * function MyComponent() {
 *   const walletConnect = useFeature<WalletConnectContract>('walletconnect')
 *
 *   // null means: not registered, disabled, or still loading
 *   if (!walletConnect) return null
 *
 *   // Feature is enabled - safe to use
 *   const WcWidget = walletConnect.components.WalletConnectWidget
 *   return <Suspense fallback={<Skeleton />}><WcWidget /></Suspense>
 * }
 */
export function useFeature<T extends FeatureContract>(name: string): T | null {
  const registry = useFeatureRegistry()

  // Get the feature handle from registry
  const feature = useSyncExternalStore(
    registry.subscribe,
    () => registry.get<T>(name),
    () => registry.get<T>(name), // Server snapshot (same as client for SSR)
  )

  // Check feature flag (this is a hook call, so must be unconditional)
  const isEnabled = feature?.useIsEnabled()

  // Return null if not registered, disabled, or loading
  if (!feature || isEnabled !== true) {
    return null
  }

  return feature
}

/**
 * Hook to get a feature's handle WITHOUT checking its feature flag.
 * Use this only when you need to access the handle regardless of enabled state.
 * For most cases, prefer `useFeature` which includes the flag check.
 *
 * @param name - The feature name to look up
 * @returns The feature handle or undefined if not registered
 */
export function useFeatureHandle<T extends FeatureContract>(name: string): T | undefined {
  const registry = useFeatureRegistry()

  return useSyncExternalStore(
    registry.subscribe,
    () => registry.get<T>(name),
    () => registry.get<T>(name),
  )
}

/**
 * Hook to check if a feature is registered.
 * Automatically re-renders when the feature's registration status changes.
 *
 * @param name - The feature name to check
 * @returns true if the feature is registered
 */
export function useHasFeature(name: string): boolean {
  const registry = useFeatureRegistry()

  return useSyncExternalStore(
    registry.subscribe,
    () => registry.has(name),
    () => registry.has(name),
  )
}

/**
 * Hook to register a feature with the registry.
 * Automatically unregisters when the component unmounts.
 *
 * @param contract - The feature contract to register
 *
 * @example
 * function WalletConnectProvider({ children }: { children: ReactNode }) {
 *   useRegisterFeature(walletConnectContract)
 *   return <>{children}</>
 * }
 */
export function useRegisterFeature<T extends FeatureContract>(contract: T): void {
  const registry = useFeatureRegistry()

  useEffect(() => {
    return registry.register(contract)
  }, [registry, contract])
}

/**
 * Hook to get all registered features.
 * Automatically re-renders when any feature is registered or unregistered.
 *
 * @returns Map of feature names to contracts
 */
export function useAllFeatures(): ReadonlyMap<string, FeatureContract> {
  const registry = useFeatureRegistry()

  return useSyncExternalStore(
    registry.subscribe,
    () => registry.getAll(),
    () => registry.getAll(),
  )
}
