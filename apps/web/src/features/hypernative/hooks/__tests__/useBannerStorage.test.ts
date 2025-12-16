import { renderHook } from '@/tests/test-utils'
import { useBannerStorage, BannerType } from '../useBannerStorage'
import * as useChainIdHook from '@/hooks/useChainId'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import type { RootState } from '@/store'
import type { HnState } from '../../store/hnStateSlice'

describe('useBannerStorage', () => {
  const chainId = '1'
  const safeAddress = '0x1234567890123456789012345678901234567890'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChainIdHook, 'default').mockReturnValue(chainId)
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: {} as any,
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
  })

  describe('BannerType.Promo', () => {
    it('should return true when no state exists', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Promo), {
        initialReduxState,
      })

      expect(result.current).toBe(true)
    })

    it('should return false when bannerDismissed is true', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: true,
            formCompleted: false,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
        } as HnState,
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Promo), {
        initialReduxState,
      })

      expect(result.current).toBe(false)
    })

    it('should return false when formCompleted is true', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: false,
            formCompleted: true,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
        } as HnState,
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Promo), {
        initialReduxState,
      })

      expect(result.current).toBe(false)
    })

    it('should return false when both bannerDismissed and formCompleted are true', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: true,
            formCompleted: true,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
        } as HnState,
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Promo), {
        initialReduxState,
      })

      expect(result.current).toBe(false)
    })

    it('should return true when both bannerDismissed and formCompleted are false', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: false,
            formCompleted: false,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
        } as HnState,
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Promo), {
        initialReduxState,
      })

      expect(result.current).toBe(true)
    })
  })

  describe('BannerType.Pending', () => {
    it('should return false when no state exists', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Pending), {
        initialReduxState,
      })

      expect(result.current).toBe(false)
    })

    it('should return false when formCompleted is false', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: false,
            formCompleted: false,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
        } as HnState,
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Pending), {
        initialReduxState,
      })

      expect(result.current).toBe(false)
    })

    it('should return false when formCompleted is true but pendingBannerDismissed is true', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: false,
            formCompleted: true,
            pendingBannerDismissed: true,
            bannerEligibilityTracked: false,
          },
        } as HnState,
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Pending), {
        initialReduxState,
      })

      expect(result.current).toBe(false)
    })

    it('should return true when formCompleted is true and pendingBannerDismissed is false', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: false,
            formCompleted: true,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
        } as HnState,
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Pending), {
        initialReduxState,
      })

      expect(result.current).toBe(true)
    })

    it('should return true when formCompleted is true and pendingBannerDismissed is false, regardless of bannerDismissed', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: true,
            formCompleted: true,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
        } as HnState,
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Pending), {
        initialReduxState,
      })

      expect(result.current).toBe(true)
    })
  })

  describe('State updates', () => {
    it('should update when bannerType changes', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: false,
            formCompleted: true,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
        } as HnState,
      }

      const { result, rerender } = renderHook(({ bannerType }) => useBannerStorage(bannerType), {
        initialProps: { bannerType: BannerType.Promo },
        initialReduxState,
      })

      // Promo should return false because formCompleted is true
      expect(result.current).toBe(false)

      // Change to Pending
      rerender({ bannerType: BannerType.Pending })

      // Pending should return true because formCompleted is true and pendingBannerDismissed is false
      expect(result.current).toBe(true)
    })

    it('should handle different safe addresses correctly', () => {
      const otherSafeAddress = '0x9876543210987654321098765432109876543210'

      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: false,
            formCompleted: false,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
          [`${chainId}:${otherSafeAddress}`]: {
            bannerDismissed: true,
            formCompleted: false,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
        } as HnState,
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Promo), {
        initialReduxState,
      })

      // Should use the current safe address (safeAddress), not otherSafeAddress
      expect(result.current).toBe(true)
    })

    it('should handle different chainIds correctly', () => {
      const otherChainId = '137'

      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: false,
            formCompleted: false,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
          [`${otherChainId}:${safeAddress}`]: {
            bannerDismissed: true,
            formCompleted: false,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: false,
          },
        } as HnState,
      }

      const { result } = renderHook(() => useBannerStorage(BannerType.Promo), {
        initialReduxState,
      })

      // Should use the current chainId (chainId), not otherChainId
      expect(result.current).toBe(true)
    })
  })
})
