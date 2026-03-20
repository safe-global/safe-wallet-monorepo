import { renderHook } from '@testing-library/react'
import { useIsEarnFeatureEnabled, useIsEarnPromoEnabled } from '../useIsEarnFeatureEnabled'
import * as useChains from '@/hooks/useChains'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { type ReactNode, createElement } from 'react'

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
}))

const mockUseHasFeature = useChains.useHasFeature as jest.MockedFunction<typeof useChains.useHasFeature>

const createWrapper =
  (isBlockedCountry: boolean) =>
  ({ children }: { children: ReactNode }) =>
    createElement(GeoblockingContext.Provider, { value: isBlockedCountry }, children)

describe('useIsEarnFeatureEnabled', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns undefined when feature flag is undefined', () => {
    mockUseHasFeature.mockReturnValue(undefined)

    const { result } = renderHook(() => useIsEarnFeatureEnabled(), {
      wrapper: createWrapper(false),
    })

    expect(result.current).toBeUndefined()
  })

  it('returns true when feature is enabled and not geoblocked', () => {
    mockUseHasFeature.mockReturnValue(true)

    const { result } = renderHook(() => useIsEarnFeatureEnabled(), {
      wrapper: createWrapper(false),
    })

    expect(result.current).toBe(true)
  })

  it('returns false when feature is enabled but geoblocked', () => {
    mockUseHasFeature.mockReturnValue(true)

    const { result } = renderHook(() => useIsEarnFeatureEnabled(), {
      wrapper: createWrapper(true),
    })

    expect(result.current).toBe(false)
  })

  it('returns false when feature is disabled', () => {
    mockUseHasFeature.mockReturnValue(false)

    const { result } = renderHook(() => useIsEarnFeatureEnabled(), {
      wrapper: createWrapper(false),
    })

    expect(result.current).toBe(false)
  })
})

describe('useIsEarnPromoEnabled', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns true when both promo and earn feature are enabled', () => {
    mockUseHasFeature.mockImplementation((feature) => {
      if (feature === FEATURES.EARN_PROMO) return true
      if (feature === FEATURES.EARN) return true
      return false
    })

    const { result } = renderHook(() => useIsEarnPromoEnabled(), {
      wrapper: createWrapper(false),
    })

    expect(result.current).toBe(true)
  })

  it('returns false when promo is disabled', () => {
    mockUseHasFeature.mockImplementation((feature) => {
      if (feature === FEATURES.EARN_PROMO) return false
      if (feature === FEATURES.EARN) return true
      return false
    })

    const { result } = renderHook(() => useIsEarnPromoEnabled(), {
      wrapper: createWrapper(false),
    })

    expect(result.current).toBe(false)
  })

  it('returns false when earn feature is disabled', () => {
    mockUseHasFeature.mockImplementation((feature) => {
      if (feature === FEATURES.EARN_PROMO) return true
      if (feature === FEATURES.EARN) return false
      return false
    })

    const { result } = renderHook(() => useIsEarnPromoEnabled(), {
      wrapper: createWrapper(false),
    })

    expect(result.current).toBe(false)
  })
})
