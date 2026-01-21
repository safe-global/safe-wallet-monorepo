import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { FeatureRegistryProvider, useFeatureRegistry } from './FeatureRegistry'
import type { FeatureHandle, FeatureContract, FeatureImplementation } from '@/features/__contracts__'

/**
 * Helper component that registers mock feature handles for testing.
 * Registers all provided handles on mount and unregisters on unmount.
 *
 * @example
 * const mockHandle = createMockFeatureHandle('my-feature', {
 *   components: {
 *     Widget: () => <div>Mock Widget</div>,
 *   },
 * })
 *
 * render(
 *   <MockFeatureRegistrar handles={[mockHandle]}>
 *     <ComponentUnderTest />
 *   </MockFeatureRegistrar>
 * )
 */
export function MockFeatureRegistrar({ handles, children }: { handles: FeatureHandle[]; children: ReactNode }) {
  const registry = useFeatureRegistry()

  useEffect(() => {
    const unregisterFns = handles.map((handle) => registry.register(handle))

    return () => {
      unregisterFns.forEach((unregister) => unregister())
    }
  }, [registry, handles])

  return <>{children}</>
}

/**
 * Test wrapper that provides both the registry and mock features.
 * Use this as a render wrapper in tests.
 *
 * @example
 * const { wrapper } = createFeatureTestWrapper([mockWalletConnectHandle])
 *
 * render(<MyComponent />, { wrapper })
 */
export function createFeatureTestWrapper(handles: FeatureHandle[] = []) {
  function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <FeatureRegistryProvider>
        <MockFeatureRegistrar handles={handles}>{children}</MockFeatureRegistrar>
      </FeatureRegistryProvider>
    )
  }

  return { wrapper: TestWrapper }
}

/**
 * Creates a minimal mock feature handle for testing.
 * The load() function returns a mock implementation synchronously wrapped in a Promise.
 * useIsEnabled defaults to () => true (enabled).
 *
 * @example
 * const mockHandle = createMockFeatureHandle('my-feature', {
 *   components: {
 *     Widget: () => <div>Test</div>,
 *   },
 * })
 */
export function createMockFeatureHandle<T extends FeatureImplementation>(
  name: string,
  implementation: T = {} as T,
  overrides: { useIsEnabled?: () => boolean | undefined } = {},
): FeatureHandle<T> {
  return {
    name,
    useIsEnabled: overrides.useIsEnabled ?? (() => true),
    load: () => Promise.resolve({ default: implementation }),
  }
}

/**
 * Creates a disabled mock feature handle for testing disabled states.
 *
 * @example
 * const disabledHandle = createDisabledFeatureHandle('my-feature')
 * // useIsEnabled will return false
 */
export function createDisabledFeatureHandle(name: string): FeatureHandle {
  return {
    name,
    useIsEnabled: () => false,
    load: () => Promise.resolve({ default: {} }),
  }
}

/**
 * Creates a loading mock feature handle for testing loading states.
 *
 * @example
 * const loadingHandle = createLoadingFeatureHandle('my-feature')
 * // useIsEnabled will return undefined
 */
export function createLoadingFeatureHandle(name: string): FeatureHandle {
  return {
    name,
    useIsEnabled: () => undefined,
    load: () => Promise.resolve({ default: {} }),
  }
}

// Legacy exports for backwards compatibility during migration
/** @deprecated Use createMockFeatureHandle instead */
export const createMockFeatureContract = createMockFeatureHandle as <T extends FeatureContract>(
  name: string,
  overrides?: Partial<Omit<T, 'name'>>,
) => FeatureHandle

/** @deprecated Use createDisabledFeatureHandle instead */
export const createDisabledFeatureContract = createDisabledFeatureHandle

/** @deprecated Use createLoadingFeatureHandle instead */
export const createLoadingFeatureContract = createLoadingFeatureHandle
