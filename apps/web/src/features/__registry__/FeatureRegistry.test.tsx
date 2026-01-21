import { render, screen, renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  FeatureRegistryProvider,
  useFeature,
  useFeatureHandle,
  useHasFeature,
  useRegisterFeature,
  useAllFeatures,
  useFeatureRegistry,
} from './FeatureRegistry'
import { createMockFeatureContract, createFeatureTestWrapper } from './testUtils'
import type { FeatureContract } from '@/features/__contracts__'

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
      expect(result.current.get).toBeInstanceOf(Function)
      expect(result.current.getAll).toBeInstanceOf(Function)
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
      const disabledFeature = createMockFeatureContract('disabled-feature', {
        useIsEnabled: () => false,
      })
      const { wrapper: testWrapper } = createFeatureTestWrapper([disabledFeature])

      const { result } = renderHook(() => useFeature('disabled-feature'), { wrapper: testWrapper })

      expect(result.current).toBeNull()
    })

    it('returns null when feature flag is loading (undefined)', () => {
      const loadingFeature = createMockFeatureContract('loading-feature', {
        useIsEnabled: () => undefined,
      })
      const { wrapper: testWrapper } = createFeatureTestWrapper([loadingFeature])

      const { result } = renderHook(() => useFeature('loading-feature'), { wrapper: testWrapper })

      expect(result.current).toBeNull()
    })

    it('returns feature when enabled', () => {
      const enabledFeature = createMockFeatureContract('enabled-feature', {
        useIsEnabled: () => true,
      })
      const { wrapper: testWrapper } = createFeatureTestWrapper([enabledFeature])

      const { result } = renderHook(() => useFeature('enabled-feature'), { wrapper: testWrapper })

      expect(result.current).toEqual(enabledFeature)
    })

    it('returns typed contract with custom methods', () => {
      interface TestContract extends FeatureContract {
        readonly name: 'typed-feature'
        customMethod: () => string
      }

      const typedFeature: TestContract = {
        name: 'typed-feature',
        useIsEnabled: () => true,
        customMethod: () => 'test',
      }

      const { wrapper: testWrapper } = createFeatureTestWrapper([typedFeature])
      const { result } = renderHook(() => useFeature<TestContract>('typed-feature'), {
        wrapper: testWrapper,
      })

      expect(result.current?.name).toBe('typed-feature')
      expect(result.current?.customMethod()).toBe('test')
    })
  })

  describe('useFeatureHandle', () => {
    it('returns undefined for unregistered feature', () => {
      const { result } = renderHook(() => useFeatureHandle('nonexistent'), { wrapper })

      expect(result.current).toBeUndefined()
    })

    it('returns handle even when feature flag is disabled', () => {
      const disabledFeature = createMockFeatureContract('disabled-handle', {
        useIsEnabled: () => false,
      })
      const { wrapper: testWrapper } = createFeatureTestWrapper([disabledFeature])

      const { result } = renderHook(() => useFeatureHandle('disabled-handle'), {
        wrapper: testWrapper,
      })

      expect(result.current).toEqual(disabledFeature)
    })
  })

  describe('useHasFeature', () => {
    it('returns false for unregistered feature', () => {
      const { result } = renderHook(() => useHasFeature('nonexistent'), { wrapper })

      expect(result.current).toBe(false)
    })

    it('returns true for registered feature', () => {
      const mockFeature = createMockFeatureContract('has-test')
      const { wrapper: testWrapper } = createFeatureTestWrapper([mockFeature])

      const { result } = renderHook(() => useHasFeature('has-test'), { wrapper: testWrapper })

      expect(result.current).toBe(true)
    })
  })

  describe('useRegisterFeature', () => {
    it('registers feature on mount', () => {
      const mockFeature = createMockFeatureContract('register-test')

      function TestComponent() {
        useRegisterFeature(mockFeature)
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

      expect(screen.getByTestId('result')).toHaveTextContent('found')
    })

    it('unregisters feature on unmount', () => {
      const mockFeature = createMockFeatureContract('unregister-test')

      function TestComponent({ show }: { show: boolean }) {
        return show ? <FeatureProvider /> : null
      }

      function FeatureProvider() {
        useRegisterFeature(mockFeature)
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

      expect(screen.getByTestId('result')).toHaveTextContent('found')

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

    it('returns all registered features', () => {
      const feature1 = createMockFeatureContract('feature-1')
      const feature2 = createMockFeatureContract('feature-2')
      const { wrapper: testWrapper } = createFeatureTestWrapper([feature1, feature2])

      const { result } = renderHook(() => useAllFeatures(), { wrapper: testWrapper })

      expect(result.current.size).toBe(2)
      expect(result.current.has('feature-1')).toBe(true)
      expect(result.current.has('feature-2')).toBe(true)
    })
  })

  describe('registry.register', () => {
    it('warns when registering duplicate feature', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
      const mockFeature = createMockFeatureContract('duplicate-test')

      const { result } = renderHook(() => useFeatureRegistry(), { wrapper })

      act(() => {
        result.current.register(mockFeature)
        result.current.register(mockFeature)
      })

      expect(consoleSpy).toHaveBeenCalledWith('Feature "duplicate-test" is already registered. Replacing.')

      consoleSpy.mockRestore()
    })

    it('returns unregister function', () => {
      const mockFeature = createMockFeatureContract('unregister-fn-test')

      const { result: registryResult } = renderHook(() => useFeatureRegistry(), { wrapper })
      let unregister: () => void

      act(() => {
        unregister = registryResult.current.register(mockFeature)
      })

      expect(registryResult.current.has('unregister-fn-test')).toBe(true)

      act(() => {
        unregister()
      })

      expect(registryResult.current.has('unregister-fn-test')).toBe(false)
    })
  })

  describe('initialFeatures prop', () => {
    it('registers initial features on mount', () => {
      const feature1 = createMockFeatureContract('initial-1')
      const feature2 = createMockFeatureContract('initial-2')

      const { result } = renderHook(() => useAllFeatures(), {
        wrapper: ({ children }) => (
          <FeatureRegistryProvider initialFeatures={[feature1, feature2]}>{children}</FeatureRegistryProvider>
        ),
      })

      expect(result.current.size).toBe(2)
      expect(result.current.has('initial-1')).toBe(true)
      expect(result.current.has('initial-2')).toBe(true)
    })
  })
})
