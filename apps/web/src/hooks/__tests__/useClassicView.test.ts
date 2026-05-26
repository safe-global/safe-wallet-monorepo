import { act, renderHook } from '@testing-library/react'
import {
  disableClassicView,
  enableClassicView,
  useIsClassicViewActive,
  useIsClassicViewFeatureEnabled,
  useIsClassicViewOptedIn,
} from '@/hooks/useClassicView'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

// Mocking via jest.mock (not jest.spyOn) keeps the mock function in the same
// shape across every render. spyOn replaces the export with a fn that calls no
// hooks of its own — when useSyncExternalStore later triggers a re-render of
// the same hook, the "previous render" was a hookless mock and the "current
// render" sees a real useChain that DOES call hooks (useGetChainsConfigV2Query,
// useMemo), which violates React's hook ordering and produces nonsense errors
// like "Cannot create property 'current' on boolean 'true'".
let mockChainData: Chain | undefined
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useChain: jest.fn(() => mockChainData),
  default: jest.fn(() => ({ configs: [], loading: false })),
  useCurrentChain: jest.fn(() => undefined),
}))

const setMockChain = (chain: Chain | undefined) => {
  mockChainData = chain
}

const mockChain = (features: FEATURES[]): Chain =>
  ({ chainId: String(DEFAULT_CHAIN_ID), features: features as unknown as string[] }) as Chain

describe('useClassicView', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    setMockChain(undefined)
  })

  afterEach(() => {
    act(() => {
      disableClassicView()
    })
  })

  describe('useIsClassicViewFeatureEnabled', () => {
    it('returns true when CLASSIC_VIEW_DISABLED is absent (default = available)', () => {
      setMockChain(mockChain([]))

      const { result } = renderHook(() => useIsClassicViewFeatureEnabled())

      expect(result.current).toBe(true)
    })

    it('returns false when CLASSIC_VIEW_DISABLED is set on the default chain', () => {
      setMockChain(mockChain([FEATURES.CLASSIC_VIEW_DISABLED]))

      const { result } = renderHook(() => useIsClassicViewFeatureEnabled())

      expect(result.current).toBe(false)
    })

    it('returns undefined while chains config has not loaded', () => {
      setMockChain(undefined)

      const { result } = renderHook(() => useIsClassicViewFeatureEnabled())

      expect(result.current).toBeUndefined()
    })
  })

  describe('useIsClassicViewOptedIn', () => {
    it('is false by default', () => {
      const { result } = renderHook(() => useIsClassicViewOptedIn())
      expect(result.current).toBe(false)
    })

    it('becomes true after enableClassicView() and notifies subscribers', () => {
      const { result } = renderHook(() => useIsClassicViewOptedIn())

      act(() => {
        enableClassicView()
      })

      expect(result.current).toBe(true)
    })

    it('returns to false after disableClassicView()', () => {
      const { result } = renderHook(() => useIsClassicViewOptedIn())

      act(() => {
        enableClassicView()
      })
      expect(result.current).toBe(true)

      act(() => {
        disableClassicView()
      })
      expect(result.current).toBe(false)
    })
  })

  describe('useIsClassicViewActive', () => {
    it('is true only when the feature is exposed AND the user has opted in', () => {
      setMockChain(mockChain([]))

      const { result } = renderHook(() => useIsClassicViewActive())
      expect(result.current).toBe(false)

      act(() => {
        enableClassicView()
      })
      expect(result.current).toBe(true)
    })

    it('stays false when the feature is disabled by the flag, even if opted in', () => {
      setMockChain(mockChain([FEATURES.CLASSIC_VIEW_DISABLED]))

      const { result } = renderHook(() => useIsClassicViewActive())

      act(() => {
        enableClassicView()
      })
      expect(result.current).toBe(false)
    })

    it('stays false while the chains config is loading', () => {
      setMockChain(undefined)

      const { result } = renderHook(() => useIsClassicViewActive())

      act(() => {
        enableClassicView()
      })
      expect(result.current).toBe(false)
    })
  })
})
