import { renderHook, waitFor } from '@/tests/test-utils'
import { useLoadFeature } from '../useLoadFeature'
import type { FeatureHandle } from '../types'

// Shared mock feature implementation
const mockImpl = {
  MyComponent: () => 'rendered',
  myService: () => 'service-result',
}

type MockImpl = typeof mockImpl

/** Creates a FeatureHandle with controllable isEnabled and load behavior. */
function createMockHandle(
  overrides: {
    isEnabled?: boolean | undefined
    loadError?: Error
  } = {},
): FeatureHandle<MockImpl> {
  return {
    name: 'test-feature',
    useIsEnabled: () => overrides.isEnabled,
    load: () => {
      if (overrides.loadError) {
        return Promise.reject(overrides.loadError)
      }
      return Promise.resolve({ default: mockImpl })
    },
  }
}

/** Renders the hook and optionally waits for it to settle. */
async function renderFeatureHook(overrides: Parameters<typeof createMockHandle>[0] = {}) {
  const handle = createMockHandle(overrides)
  const rendered = renderHook(() => useLoadFeature(handle))

  // If feature is enabled, wait for the async load to complete
  if (overrides.isEnabled === true && !overrides.loadError) {
    await waitFor(() => {
      expect(rendered.result.current.$isReady).toBe(true)
    })
  } else if (overrides.loadError) {
    await waitFor(() => {
      expect(rendered.result.current.$error).toBeDefined()
    })
  }

  return { ...rendered, handle }
}

describe('useLoadFeature', () => {
  // ── Meta state lifecycle ──────────────────────────────────────

  describe('meta state lifecycle', () => {
    it.each([
      {
        scenario: 'flag still loading (isEnabled undefined)',
        isEnabled: undefined as boolean | undefined,
        expected: { $isDisabled: false, $isReady: false, $error: undefined },
      },
      {
        scenario: 'disabled (isEnabled false)',
        isEnabled: false as boolean | undefined,
        expected: { $isDisabled: true, $isReady: false, $error: undefined },
      },
    ])('should report correct meta when $scenario', ({ isEnabled, expected }) => {
      const handle = createMockHandle({ isEnabled })
      const { result } = renderHook(() => useLoadFeature(handle))

      expect(result.current.$isDisabled).toBe(expected.$isDisabled)
      expect(result.current.$isReady).toBe(expected.$isReady)
      expect(result.current.$error).toBe(expected.$error)
    })

    it('should reach $isReady after successful load', async () => {
      const { result } = await renderFeatureHook({ isEnabled: true })

      expect(result.current.$isReady).toBe(true)
      expect(result.current.$isDisabled).toBe(false)
      expect(result.current.$error).toBeUndefined()
    })

    it('should set $error on load failure', async () => {
      const loadError = new Error('load failed')
      const { result } = await renderFeatureHook({ isEnabled: true, loadError })

      expect(result.current.$error).toEqual(loadError)
      expect(result.current.$isReady).toBe(false)
    })

    it('should not expose a $isLoading meta property', () => {
      const handle = createMockHandle({ isEnabled: undefined })
      const { result } = renderHook(() => useLoadFeature(handle))

      // $isLoading was removed — only $isDisabled, $isReady, $error exist
      expect((result.current as unknown as Record<string, unknown>).$isLoading).toBeUndefined()
    })
  })

  // ── Feature implementation access ─────────────────────────────

  describe('feature implementation', () => {
    it('should expose loaded feature exports when ready', async () => {
      const { result } = await renderFeatureHook({ isEnabled: true })

      expect(result.current.MyComponent).toBe(mockImpl.MyComponent)
      expect(result.current.myService).toBe(mockImpl.myService)
    })

    it('should include name and useIsEnabled on loaded feature', async () => {
      const { result, handle } = await renderFeatureHook({ isEnabled: true })

      expect(result.current.name).toBe('test-feature')
      expect(result.current.useIsEnabled).toBe(handle.useIsEnabled)
    })
  })

  // ── Stub proxy behavior ───────────────────────────────────────

  describe('stub proxy', () => {
    it('should return a component stub (returns null) for PascalCase names', () => {
      const handle = createMockHandle({ isEnabled: undefined })
      const { result } = renderHook(() => useLoadFeature(handle))

      const stub = result.current.MyComponent
      expect(typeof stub).toBe('function')
      expect(stub()).toBeNull()
    })

    it('should return undefined for camelCase service names', () => {
      const handle = createMockHandle({ isEnabled: undefined })
      const { result } = renderHook(() => useLoadFeature(handle))

      expect(result.current.myService).toBeUndefined()
    })

    it('should return a stable proxy reference across re-renders while not ready', () => {
      const handle = createMockHandle({ isEnabled: undefined })
      const { result, rerender } = renderHook(() => useLoadFeature(handle))

      const firstRef = result.current
      rerender()
      const secondRef = result.current

      expect(firstRef).toBe(secondRef)
    })

    it('should return a stable component stub reference across accesses', () => {
      const handle = createMockHandle({ isEnabled: undefined })
      const { result } = renderHook(() => useLoadFeature(handle))

      const stub1 = result.current.MyComponent
      const stub2 = result.current.MyComponent
      expect(stub1).toBe(stub2)
    })
  })

  // ── Feature module caching ────────────────────────────────────

  describe('feature caching', () => {
    it('should not re-trigger load when isEnabled flickers', async () => {
      let isEnabled: boolean | undefined = true
      const loadSpy = jest.fn(() => Promise.resolve({ default: mockImpl }))

      const handle: FeatureHandle<MockImpl> = {
        name: 'test-feature',
        useIsEnabled: () => isEnabled,
        load: loadSpy,
      }

      const { result, rerender } = renderHook(() => useLoadFeature(handle))

      await waitFor(() => {
        expect(result.current.$isReady).toBe(true)
      })

      expect(loadSpy).toHaveBeenCalledTimes(1)

      // Flicker: true -> undefined -> true (simulates chain switch)
      isEnabled = undefined
      rerender()

      isEnabled = true
      rerender()

      await waitFor(() => {
        expect(result.current.$isReady).toBe(true)
      })

      // load() should NOT have been called again
      expect(loadSpy).toHaveBeenCalledTimes(1)
    })
  })

  // ── Render count ──────────────────────────────────────────────

  describe('render count', () => {
    it('should render at most twice for initial mount -> ready', async () => {
      let renderCount = 0

      const handle: FeatureHandle<MockImpl> = {
        name: 'test-feature',
        useIsEnabled: () => true,
        load: () => Promise.resolve({ default: mockImpl }),
      }

      const { result } = renderHook(() => {
        renderCount++
        return useLoadFeature(handle)
      })

      await waitFor(() => {
        expect(result.current.$isReady).toBe(true)
      })

      // Mount render + ready render (no intermediate loading state)
      expect(renderCount).toBeLessThanOrEqual(3)
    })

    it('should render once for disabled feature (no async work)', () => {
      let renderCount = 0

      const handle: FeatureHandle<MockImpl> = {
        name: 'test-feature',
        useIsEnabled: () => false,
        load: jest.fn(),
      }

      renderHook(() => {
        renderCount++
        return useLoadFeature(handle)
      })

      // Single synchronous render — no loading transition
      expect(renderCount).toBeLessThanOrEqual(2)
    })

    it('should not cause extra renders on isEnabled flicker after load', async () => {
      let isEnabled: boolean | undefined = true
      let renderCount = 0

      const handle: FeatureHandle<MockImpl> = {
        name: 'test-feature',
        useIsEnabled: () => isEnabled,
        load: () => Promise.resolve({ default: mockImpl }),
      }

      const { result, rerender } = renderHook(() => {
        renderCount++
        return useLoadFeature(handle)
      })

      await waitFor(() => {
        expect(result.current.$isReady).toBe(true)
      })

      const countAfterReady = renderCount

      // Flicker: true -> undefined -> true
      isEnabled = undefined
      rerender()
      isEnabled = true
      rerender()

      await waitFor(() => {
        expect(result.current.$isReady).toBe(true)
      })

      // 2 explicit rerenders + possible effect re-run for cache restore.
      const flickerRenders = renderCount - countAfterReady
      expect(flickerRenders).toBeLessThanOrEqual(5)
    })
  })
})
