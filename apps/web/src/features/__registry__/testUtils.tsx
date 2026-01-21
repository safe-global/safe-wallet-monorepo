import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { FeatureRegistryProvider, useFeatureRegistry } from './FeatureRegistry'
import type { FeatureContract } from '@/features/__contracts__'

/**
 * Helper component that registers mock features for testing.
 * Registers all provided features on mount and unregisters on unmount.
 *
 * @example
 * const mockFeature = {
 *   name: 'my-feature',
 *   useIsEnabled: () => true,
 *   components: {
 *     Widget: () => <div>Mock Widget</div>,
 *   },
 * }
 *
 * render(
 *   <MockFeatureRegistrar features={[mockFeature]}>
 *     <ComponentUnderTest />
 *   </MockFeatureRegistrar>
 * )
 */
export function MockFeatureRegistrar({ features, children }: { features: FeatureContract[]; children: ReactNode }) {
  const registry = useFeatureRegistry()

  useEffect(() => {
    const unregisterFns = features.map((feature) => registry.register(feature))

    return () => {
      unregisterFns.forEach((unregister) => unregister())
    }
  }, [registry, features])

  return <>{children}</>
}

/**
 * Test wrapper that provides both the registry and mock features.
 * Use this as a render wrapper in tests.
 *
 * @example
 * const { wrapper } = createFeatureTestWrapper([mockWalletConnect, mockHypernative])
 *
 * render(<MyComponent />, { wrapper })
 */
export function createFeatureTestWrapper(features: FeatureContract[] = []) {
  function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <FeatureRegistryProvider>
        <MockFeatureRegistrar features={features}>{children}</MockFeatureRegistrar>
      </FeatureRegistryProvider>
    )
  }

  return { wrapper: TestWrapper }
}

/**
 * Creates a minimal mock feature contract for testing.
 * useIsEnabled defaults to () => true (enabled).
 * Override any properties as needed.
 *
 * @example
 * const mockFeature = createMockFeatureContract('my-feature', {
 *   components: {
 *     Widget: () => <div>Test</div>,
 *   },
 * })
 */
export function createMockFeatureContract<T extends FeatureContract>(
  name: string,
  overrides: Partial<Omit<T, 'name'>> = {},
): T {
  return {
    name,
    useIsEnabled: () => true, // Default: feature is enabled
    ...overrides,
  } as T
}

/**
 * Creates a disabled mock feature contract for testing disabled states.
 *
 * @example
 * const disabledFeature = createDisabledFeatureContract('my-feature')
 * // useIsEnabled will return false
 */
export function createDisabledFeatureContract(name: string): FeatureContract {
  return {
    name,
    useIsEnabled: () => false,
  }
}

/**
 * Creates a loading mock feature contract for testing loading states.
 *
 * @example
 * const loadingFeature = createLoadingFeatureContract('my-feature')
 * // useIsEnabled will return undefined
 */
export function createLoadingFeatureContract(name: string): FeatureContract {
  return {
    name,
    useIsEnabled: () => undefined,
  }
}
