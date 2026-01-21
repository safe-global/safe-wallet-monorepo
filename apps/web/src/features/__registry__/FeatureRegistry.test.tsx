import { render, screen, renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  FeatureRegistryProvider,
  useFeature,
  useHasFeature,
  useRegisterFeature,
  useAllFeatures,
  useFeatureRegistry,
} from './FeatureRegistry'
import {
  createMockFeatureHandle,
  createDisabledFeatureHandle,
  createLoadingFeatureHandle,
  createFeatureTestWrapper,
} from './testUtils'
import type { FeatureContract, FeatureHandle } from '@/features/__contracts__'

describe('FeatureRegistry', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <FeatureRegistryProvider>{children}</FeatureRegistryProvider>
  )

  describe('useFeatureRegistry', () => {
    it('throws error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useFeatureRegistry())
      }).toThrow('useFeatureRegistry must be used within a FeatureRegistryProvider')

      consoleSpy.mockRestore()
    })

    it('provides registry methods', () => {
      const { result } = renderHook(() => useFeatureRegistry(), { wrapper })

      expect(result.current.register).toBeInstanceOf(Function)
      expect(result.current.getHandle).toBeInstanceOf(Function)
      expect(result.current.getAllHandles).toBeInstanceOf(Function)
      expect(result.current.has).toBeInstanceOf(Function)
      expect(result.current.subscribe).toBeInstanceOf(Function)
    })
  })

  describe('useFeature', () => {
    it('returns null for unregistered feature', () => {
      const { result } = renderHook(() => useFeature('nonexistent'), { wrapper })

      expect(result.current).toBeNull()
    })

    it('returns null when feature flag is disabled', () => {
      const disabledHandle = createDisabledFeatureHandle('disabled-feature')
      const { wrapper: testWrapper } = createFeatureTestWrapper([disabledHandle])

      const { result } = renderHook(() => useFeature('disabled-feature'), { wrapper: testWrapper })

      expect(result.current).toBeNull()
    })

    it('returns null when feature flag is loading (undefined)', () => {
      const loadingHandle = createLoadingFeatureHandle('loading-feature')
      const { wrapper: testWrapper } = createFeatureTestWrapper([loadingHandle])

      const { result } = renderHook(() => useFeature('loading-feature'), { wrapper: testWrapper })

      expect(result.current).toBeNull()
    })

    it('returns loaded feature when enabled', async () => {
      const mockImplementation = { services: { customData: 'test-value' } }
      const enabledHandle = createMockFeatureHandle('enabled-feature', mockImplementation)
      const { wrapper: testWrapper } = createFeatureTestWrapper([enabledHandle])

      const { result } = renderHook(() => useFeature('enabled-feature'), { wrapper: testWrapper })

      // Initially null while loading
      expect(result.current).toBeNull()

      // Wait for async load to complete
      await waitFor(() => {
        expect(result.current).not.toBeNull()
      })

      expect(result.current?.name).toBe('enabled-feature')
      expect(result.current?.services?.customData).toBe('test-value')
    })

    it('returns typed contract with custom hooks', async () => {
      interface TestImplementation {
        hooks: {
          useCustomData: () => string
        }
      }

      interface TestContract extends FeatureContract {
        readonly name: 'typed-feature'
        hooks: {
          useCustomData: () => string
        }
      }

      const mockImplementation: TestImplementation = {
        hooks: {
          useCustomData: () => 'test',
        },
      }

      const typedHandle = createMockFeatureHandle('typed-feature', mockImplementation)
      const { wrapper: testWrapper } = createFeatureTestWrapper([typedHandle])

      const { result } = renderHook(() => useFeature<TestContract>('typed-feature'), {
        wrapper: testWrapper,
      })

      await waitFor(() => {
        expect(result.current).not.toBeNull()
      })

      expect(result.current?.name).toBe('typed-feature')
      expect(result.current?.hooks?.useCustomData()).toBe('test')
    })
  })

  describe('useHasFeature', () => {
    it('returns false for unregistered feature', () => {
      const { result } = renderHook(() => useHasFeature('nonexistent'), { wrapper })

      expect(result.current).toBe(false)
    })

    it('returns true for registered feature', () => {
      const mockHandle = createMockFeatureHandle('has-test')
      const { wrapper: testWrapper } = createFeatureTestWrapper([mockHandle])

      const { result } = renderHook(() => useHasFeature('has-test'), { wrapper: testWrapper })

      expect(result.current).toBe(true)
    })
  })

  describe('useRegisterFeature', () => {
    it('registers feature on mount', async () => {
      const mockHandle = createMockFeatureHandle('register-test')

      function TestComponent() {
        useRegisterFeature(mockHandle)
        return null
      }

      function Consumer() {
        const feature = useFeature('register-test')
        return <div data-testid="result">{feature ? 'found' : 'not found'}</div>
      }

      render(
        <FeatureRegistryProvider>
          <TestComponent />
          <Consumer />
        </FeatureRegistryProvider>,
      )

      // Wait for async load
      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('found')
      })
    })

    it('unregisters feature on unmount', async () => {
      const mockHandle = createMockFeatureHandle('unregister-test')

      function TestComponent({ show }: { show: boolean }) {
        return show ? <FeatureProvider /> : null
      }

      function FeatureProvider() {
        useRegisterFeature(mockHandle)
        return null
      }

      function Consumer() {
        const feature = useFeature('unregister-test')
        return <div data-testid="result">{feature ? 'found' : 'not found'}</div>
      }

      const { rerender } = render(
        <FeatureRegistryProvider>
          <TestComponent show={true} />
          <Consumer />
        </FeatureRegistryProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('found')
      })

      rerender(
        <FeatureRegistryProvider>
          <TestComponent show={false} />
          <Consumer />
        </FeatureRegistryProvider>,
      )

      expect(screen.getByTestId('result')).toHaveTextContent('not found')
    })
  })

  describe('useAllFeatures', () => {
    it('returns empty map when no features registered', () => {
      const { result } = renderHook(() => useAllFeatures(), { wrapper })

      expect(result.current.size).toBe(0)
    })

    it('returns all registered feature handles', () => {
      const handle1 = createMockFeatureHandle('feature-1')
      const handle2 = createMockFeatureHandle('feature-2')
      const { wrapper: testWrapper } = createFeatureTestWrapper([handle1, handle2])

      const { result } = renderHook(() => useAllFeatures(), { wrapper: testWrapper })

      expect(result.current.size).toBe(2)
      expect(result.current.has('feature-1')).toBe(true)
      expect(result.current.has('feature-2')).toBe(true)
    })
  })

  describe('registry.register', () => {
    it('warns when registering duplicate feature', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const mockHandle = createMockFeatureHandle('duplicate-test')

      const { result } = renderHook(() => useFeatureRegistry(), { wrapper })

      act(() => {
        result.current.register(mockHandle)
        result.current.register(mockHandle)
      })

      expect(consoleSpy).toHaveBeenCalledWith('Feature "duplicate-test" is already registered. Replacing.')

      consoleSpy.mockRestore()
    })

    it('returns unregister function', () => {
      const mockHandle = createMockFeatureHandle('unregister-fn-test')

      const { result: registryResult } = renderHook(() => useFeatureRegistry(), { wrapper })
      let unregister: () => void

      act(() => {
        unregister = registryResult.current.register(mockHandle)
      })

      expect(registryResult.current.has('unregister-fn-test')).toBe(true)

      act(() => {
        unregister()
      })

      expect(registryResult.current.has('unregister-fn-test')).toBe(false)
    })
  })

  describe('initialFeatures prop', () => {
    it('registers initial feature handles on mount', () => {
      const handle1 = createMockFeatureHandle('initial-1')
      const handle2 = createMockFeatureHandle('initial-2')

      const { result } = renderHook(() => useAllFeatures(), {
        wrapper: ({ children }) => (
          <FeatureRegistryProvider initialFeatures={[handle1, handle2]}>{children}</FeatureRegistryProvider>
        ),
      })

      expect(result.current.size).toBe(2)
      expect(result.current.has('initial-1')).toBe(true)
      expect(result.current.has('initial-2')).toBe(true)
    })
  })

  describe('lazy loading behavior', () => {
    it('does not call load() when feature is disabled', async () => {
      const loadFn = jest.fn().mockResolvedValue({ default: {} })
      const disabledHandle: FeatureHandle = {
        name: 'disabled-lazy',
        useIsEnabled: () => false,
        load: loadFn,
      }
      const { wrapper: testWrapper } = createFeatureTestWrapper([disabledHandle])

      renderHook(() => useFeature('disabled-lazy'), { wrapper: testWrapper })

      // Give time for any potential load call
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(loadFn).not.toHaveBeenCalled()
    })

    it('calls load() once when feature is enabled', async () => {
      const loadFn = jest.fn().mockResolvedValue({ default: { data: 'test' } })
      const enabledHandle: FeatureHandle = {
        name: 'enabled-lazy',
        useIsEnabled: () => true,
        load: loadFn,
      }
      const { wrapper: testWrapper } = createFeatureTestWrapper([enabledHandle])

      const { result } = renderHook(() => useFeature('enabled-lazy'), { wrapper: testWrapper })

      await waitFor(() => {
        expect(result.current).not.toBeNull()
      })

      expect(loadFn).toHaveBeenCalledTimes(1)
    })

    it('caches loaded feature across multiple hook calls within same provider', async () => {
      const loadFn = jest.fn().mockResolvedValue({ default: { services: { data: 'cached' } } })
      const cachedHandle: FeatureHandle = {
        name: 'cached-feature',
        useIsEnabled: () => true,
        load: loadFn,
      }

      // Use a single component that calls useFeature twice to test caching
      function TestComponent() {
        const feature1 = useFeature('cached-feature')
        const feature2 = useFeature('cached-feature')
        return (
          <div>
            <span data-testid="result1">{feature1 ? 'loaded1' : 'loading1'}</span>
            <span data-testid="result2">{feature2 ? 'loaded2' : 'loading2'}</span>
          </div>
        )
      }

      render(
        <FeatureRegistryProvider initialFeatures={[cachedHandle]}>
          <TestComponent />
        </FeatureRegistryProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('result1')).toHaveTextContent('loaded1')
        expect(screen.getByTestId('result2')).toHaveTextContent('loaded2')
      })

      // load() should only have been called once despite two useFeature calls
      expect(loadFn).toHaveBeenCalledTimes(1)
    })
  })
})
