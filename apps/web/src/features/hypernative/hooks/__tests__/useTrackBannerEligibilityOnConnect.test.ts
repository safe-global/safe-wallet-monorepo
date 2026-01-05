import { renderHook, waitFor } from '@/tests/test-utils'
import { useTrackBannerEligibilityOnConnect, activeTrackingSafes } from '../useTrackBannerEligibilityOnConnect'
import type { BannerVisibilityResult } from '../useBannerVisibility'
import { BannerType } from '../useBannerStorage'
import * as useChainIdHook from '@/hooks/useChainId'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { trackEvent } from '@/services/analytics'
import { HYPERNATIVE_EVENTS } from '@/services/analytics/events/hypernative'
import { MixpanelEventParams } from '@/services/analytics'
import type { RootState } from '@/store'
import type { HnState } from '../../store/hnStateSlice'

// Mock analytics
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

describe('useTrackBannerEligibilityOnConnect', () => {
  const chainId = '1'
  const safeAddress = '0x1234567890123456789012345678901234567890'
  const otherSafeAddress = '0x9876543210987654321098765432109876543210'
  const otherChainId = '137'

  const eligibleVisibilityResult: BannerVisibilityResult = {
    showBanner: true,
    loading: false,
  }

  const ineligibleVisibilityResult: BannerVisibilityResult = {
    showBanner: false,
    loading: false,
  }

  const loadingVisibilityResult: BannerVisibilityResult = {
    showBanner: false,
    loading: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    activeTrackingSafes.clear()
    mockTrackEvent.mockReturnValue(undefined)
    jest.spyOn(useChainIdHook, 'default').mockReturnValue(chainId)
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: {} as any,
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
  })

  describe('Event fires once when conditions are met', () => {
    it('should track "Guardian Banner Viewed" event once when all conditions are met', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult), {
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
        expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
        })
      })
    })

    it('should track event with correct parameters', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult), {
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'Guardian Banner Viewed',
            category: 'hypernative',
          }),
          {
            [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
            [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
          },
        )
      })
    })
  })

  describe('Event does not fire when conditions are not met', () => {
    it('should not track when Safe is loading', () => {
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: {} as any,
        safeAddress,
        safeLoaded: false,
        safeLoading: true,
        safeError: undefined,
      })

      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult), {
        initialReduxState,
      })

      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track when Safe is not loaded', () => {
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: {} as any,
        safeAddress,
        safeLoaded: false,
        safeLoading: false,
        safeError: undefined,
      })

      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult), {
        initialReduxState,
      })

      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track when banner visibility is loading', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(loadingVisibilityResult), {
        initialReduxState,
      })

      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track when banner should not be shown', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(ineligibleVisibilityResult), {
        initialReduxState,
      })

      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track when safeAddress is missing', () => {
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: {} as any,
        safeAddress: '',
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult), {
        initialReduxState,
      })

      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track when chainId is missing', () => {
      jest.spyOn(useChainIdHook, 'default').mockReturnValue('')

      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult), {
        initialReduxState,
      })

      expect(mockTrackEvent).not.toHaveBeenCalled()
    })
  })

  describe('Event does not fire for excluded banner types', () => {
    it('should not track when bannerType is TxReportButton', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.TxReportButton), {
        initialReduxState,
      })

      // Wait a bit to ensure effect has run
      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )
    })

    it('should not track when bannerType is Pending', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Pending), {
        initialReduxState,
      })

      // Wait a bit to ensure effect has run
      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )
    })

    it('should track when bannerType is Promo', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should track when bannerType is Settings', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Settings), {
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should not track when bannerType is NoBalanceCheck', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.NoBalanceCheck), {
        initialReduxState,
      })

      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )
    })
  })

  describe('Event does not re-fire for the same Safe', () => {
    it('should not track again if already tracked for this Safe', () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: false,
            formCompleted: false,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: true, // Already tracked
          },
        } as HnState,
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult), {
        initialReduxState,
      })

      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track again when visibility result changes but already tracked', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: false,
            formCompleted: false,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: true,
          },
        } as HnState,
      }

      const { rerender } = renderHook(({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult), {
        initialProps: { visibilityResult: eligibleVisibilityResult },
        initialReduxState,
      })

      // Change visibility result
      rerender({ visibilityResult: { ...eligibleVisibilityResult, showBanner: true } })

      await waitFor(() => {
        expect(mockTrackEvent).not.toHaveBeenCalled()
      })
    })

    it('should not re-fire when user dismisses banner, switches Safe, and returns to previously tracked Safe', async () => {
      // First, track for the first Safe
      const initialReduxState1: Partial<RootState> = {
        hnState: {},
      }

      renderHook(({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult), {
        initialProps: { visibilityResult: eligibleVisibilityResult },
        initialReduxState: initialReduxState1,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // User dismisses banner (bannerDismissed = true, but bannerEligibilityTracked stays true)
      const stateAfterDismiss: Partial<RootState> = {
        hnState: {
          [`${chainId}:${safeAddress}`]: {
            bannerDismissed: true,
            formCompleted: false,
            pendingBannerDismissed: false,
            bannerEligibilityTracked: true, // Still tracked
          },
        } as HnState,
      }

      // Switch to different Safe (non-eligible) - create new hook instance with persisted state
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: {} as any,
        safeAddress: otherSafeAddress,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      const { rerender: rerender2 } = renderHook(
        ({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult),
        {
          initialProps: { visibilityResult: ineligibleVisibilityResult },
          initialReduxState: stateAfterDismiss, // Use state with tracked flag
        },
      )

      // Should not track for non-eligible Safe
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1) // Still only 1 call
      })

      // Return to original Safe with persisted state
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: {} as any,
        safeAddress,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      rerender2({ visibilityResult: eligibleVisibilityResult })

      // Should not track again for the same Safe because bannerEligibilityTracked is true
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1) // Still only 1 call
      })
    })
  })

  describe('Event fires once per different Safe', () => {
    it('should track separately for different Safe addresses', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Track for first Safe
      const { rerender } = renderHook(({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult), {
        initialProps: { visibilityResult: eligibleVisibilityResult },
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
        expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
        })
      })

      // Switch to different Safe
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: {} as any,
        safeAddress: otherSafeAddress,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      rerender({ visibilityResult: eligibleVisibilityResult })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(2)
        expect(mockTrackEvent).toHaveBeenLastCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: otherSafeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
        })
      })
    })

    it('should track separately for different chainIds', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Track for first chain
      const { rerender } = renderHook(({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult), {
        initialProps: { visibilityResult: eligibleVisibilityResult },
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
        expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
        })
      })

      // Switch to different chain
      jest.spyOn(useChainIdHook, 'default').mockReturnValue(otherChainId)

      rerender({ visibilityResult: eligibleVisibilityResult })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(2)
        expect(mockTrackEvent).toHaveBeenLastCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: otherChainId,
        })
      })
    })

    it('should track separately for same address on different chains', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Track for chain 1
      const { rerender } = renderHook(({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult), {
        initialProps: { visibilityResult: eligibleVisibilityResult },
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
        expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
        })
      })

      // Switch to different chain with same address
      jest.spyOn(useChainIdHook, 'default').mockReturnValue(otherChainId)

      rerender({ visibilityResult: eligibleVisibilityResult })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(2)
        expect(mockTrackEvent).toHaveBeenLastCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: otherChainId,
        })
      })
    })
  })

  describe('Race condition prevention', () => {
    it('should not track multiple times when visibility result changes rapidly', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult), {
        initialProps: { visibilityResult: eligibleVisibilityResult },
        initialReduxState,
      })

      // Rapidly change visibility result
      rerender({ visibilityResult: { ...eligibleVisibilityResult, showBanner: true } })
      rerender({ visibilityResult: { ...eligibleVisibilityResult, showBanner: true } })
      rerender({ visibilityResult: { ...eligibleVisibilityResult, showBanner: true } })

      await waitFor(() => {
        // Should only track once despite multiple rerenders
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Tracking guard prevents multiple hook instances from tracking the same Safe simultaneously', () => {
    it('should prevent double tracking when guard already initiated', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const safeKey = `${chainId}:${safeAddress}`
      activeTrackingSafes.add(safeKey)

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult), {
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).not.toHaveBeenCalled()
      })

      activeTrackingSafes.delete(safeKey)
    })

    it('should clear guard when hook unmounts', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const safeKey = `${chainId}:${safeAddress}`

      const { unmount } = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult), {
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      unmount()

      await waitFor(() => {
        expect(activeTrackingSafes.has(safeKey)).toBe(false)
      })
    })
  })

  describe('Redux state updates', () => {
    it('should update Redux state when tracking event', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult), {
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Rerender with the same visibility result - should not track again
      // because Redux state was updated in the previous render
      rerender()

      await waitFor(() => {
        // Should not track again because state was updated
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Multiple banner types tracking simultaneously', () => {
    it('should track only once when Promo and NoBalanceCheck banners mount simultaneously', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Render both banner types at the same time
      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.NoBalanceCheck), {
        initialReduxState,
      })

      await waitFor(() => {
        // Should only track once from Promo (NoBalanceCheck doesn't track)
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
        expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
        })
      })
    })

    it('should track only once when Promo, NoBalanceCheck, and Settings banners mount simultaneously', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Render all three banner types at the same time
      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.NoBalanceCheck), {
        initialReduxState,
      })

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Settings), {
        initialReduxState,
      })

      await waitFor(() => {
        // Should only track once from Promo or Settings (NoBalanceCheck doesn't track)
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should track only once when multiple instances of the same banner type mount', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Render multiple instances of Promo banner
      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      await waitFor(() => {
        // Should only track once despite three instances
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should not track when excluded banner types (TxReportButton, Pending) mount with trackable types', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Render trackable and excluded types together
      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.TxReportButton), {
        initialReduxState,
      })

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Pending), {
        initialReduxState,
      })

      await waitFor(() => {
        // Should track once from Promo, excluded types should not interfere
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Banner type switching scenarios', () => {
    it('should not track again when switching from Promo to Settings banner type', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(
        ({ bannerType }) => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, bannerType),
        {
          initialProps: { bannerType: BannerType.Promo },
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Switch to Settings banner type
      rerender({ bannerType: BannerType.Settings })

      await waitFor(() => {
        // Should not track again because already tracked
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should track when switching from NoBalanceCheck to Promo banner type', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(
        ({ bannerType }) => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, bannerType),
        {
          initialProps: { bannerType: BannerType.NoBalanceCheck },
          initialReduxState,
        },
      )

      // NoBalanceCheck should not track
      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )

      // Switch to Promo banner type
      rerender({ bannerType: BannerType.Promo })

      await waitFor(() => {
        // Should track now when switching to Promo
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Banner types with different visibility states', () => {
    it('should not track when Promo banner type has showBanner: false', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(ineligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )
    })

    it('should not track when Settings banner type has showBanner: false', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(ineligibleVisibilityResult, BannerType.Settings), {
        initialReduxState,
      })

      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )
    })

    it('should not track when NoBalanceCheck banner type has showBanner: false', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(ineligibleVisibilityResult, BannerType.NoBalanceCheck), {
        initialReduxState,
      })

      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )
    })

    it('should not track when NoBalanceCheck banner type has showBanner: true but Safe is deployed', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Mock Safe as deployed
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { deployed: true } as any,
        safeAddress,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.NoBalanceCheck), {
        initialReduxState,
      })

      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )
    })

    it('should not track when NoBalanceCheck banner type has showBanner: true and Safe is not deployed', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Mock Safe as not deployed
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { deployed: false } as any,
        safeAddress,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.NoBalanceCheck), {
        initialReduxState,
      })

      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )
    })

    it('should track when visibility changes from false to true for Promo banner and the banner was not tracked yet', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { unmount } = renderHook(
        () => useTrackBannerEligibilityOnConnect(ineligibleVisibilityResult, BannerType.Promo),
        {
          initialReduxState,
        },
      )

      // Should not track when showBanner is false
      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )

      // Unmount the first hook instance to ensure clean state
      unmount()

      // Clear shared state
      activeTrackingSafes.clear()
      jest.clearAllMocks()

      // Mount a fresh hook instance with showBanner: true
      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      // Wait for effect to run and check tracking
      await waitFor(
        () => {
          // Should track now when showBanner is true
          expect(mockTrackEvent).toHaveBeenCalledTimes(1)
          expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
            [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
            [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
          })
        },
        { timeout: 1000 },
      )
    })

    it('should not track when showBanner is false even if all other conditions are met', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // All conditions are met except showBanner
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { deployed: false } as any,
        safeAddress,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      renderHook(() => useTrackBannerEligibilityOnConnect(ineligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )
    })
  })

  describe('Banner types across different Safes and chains', () => {
    it('should track separately for Promo banner on different Safes', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(
        ({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult, BannerType.Promo),
        {
          initialProps: { visibilityResult: eligibleVisibilityResult },
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
        expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
        })
      })

      // Switch to different Safe
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: {} as any,
        safeAddress: otherSafeAddress,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      rerender({ visibilityResult: eligibleVisibilityResult })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(2)
        expect(mockTrackEvent).toHaveBeenLastCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: otherSafeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
        })
      })
    })

    it('should track separately for Settings banner on different chains', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(
        ({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult, BannerType.Settings),
        {
          initialProps: { visibilityResult: eligibleVisibilityResult },
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Switch to different chain
      jest.spyOn(useChainIdHook, 'default').mockReturnValue(otherChainId)

      rerender({ visibilityResult: eligibleVisibilityResult })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(2)
        expect(mockTrackEvent).toHaveBeenLastCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: otherChainId,
        })
      })
    })

    it('should not track when NoBalanceCheck banner is used on multiple Safes', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // NoBalanceCheck should not track for first Safe
      const { rerender } = renderHook(
        ({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult, BannerType.NoBalanceCheck),
        {
          initialProps: { visibilityResult: eligibleVisibilityResult },
          initialReduxState,
        },
      )

      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )

      // Switch to different Safe
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: {} as any,
        safeAddress: otherSafeAddress,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      rerender({ visibilityResult: eligibleVisibilityResult })

      await waitFor(
        () => {
          // Should still not track because NoBalanceCheck doesn't trigger tracking
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )
    })
  })

  describe('Edge cases with banner types and tracking', () => {
    it('should handle rapid banner type changes without duplicate tracking', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(
        ({ bannerType }) => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, bannerType),
        {
          initialProps: { bannerType: BannerType.Promo },
          initialReduxState,
        },
      )

      // Rapidly switch between banner types
      rerender({ bannerType: BannerType.Settings })
      rerender({ bannerType: BannerType.NoBalanceCheck })
      rerender({ bannerType: BannerType.Promo })
      rerender({ bannerType: BannerType.Settings })

      await waitFor(() => {
        // Should only track once despite rapid changes
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should not track when one banner type tracks and another tries immediately after', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // First banner type tracks
      const { unmount: unmountPromo } = renderHook(
        () => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo),
        {
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Immediately try with another banner type
      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Settings), {
        initialReduxState,
      })

      await waitFor(() => {
        // Should not track again because Redux state was updated
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      unmountPromo()
    })

    it('should track correctly when banner type changes from excluded to trackable after state update', async () => {
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

      const { rerender } = renderHook(
        ({ bannerType }) => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, bannerType),
        {
          initialProps: { bannerType: BannerType.TxReportButton },
          initialReduxState,
        },
      )

      // Should not track for TxReportButton
      await waitFor(
        () => {
          expect(mockTrackEvent).not.toHaveBeenCalled()
        },
        { timeout: 100 },
      )

      // Switch to Promo
      rerender({ bannerType: BannerType.Promo })

      await waitFor(() => {
        // Should track now
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle concurrent tracking attempts from different banner types with same Safe', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Simulate concurrent mounting by rendering all trackable types
      const hooks = [
        renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
          initialReduxState,
        }),
        renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.NoBalanceCheck), {
          initialReduxState,
        }),
        renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Settings), {
          initialReduxState,
        }),
      ]

      await waitFor(() => {
        // Should only track once from Promo or Settings (NoBalanceCheck doesn't track)
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Cleanup
      hooks.forEach((hook) => hook.unmount())
    })
  })

  describe('Multiple useBannerVisibility instances (root cause: multiple components)', () => {
    it('should track only once when multiple hook instances mount simultaneously with same visibility result', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Simulate multiple components calling useBannerVisibility simultaneously
      // Each creates its own useTrackBannerEligibilityOnConnect instance
      const hook1 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })
      const hook2 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })
      const hook3 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })
      const hook4 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })
      const hook5 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      await waitFor(() => {
        // Should only track once despite 5 concurrent instances
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
        expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
        })
      })

      // Cleanup
      hook1.unmount()
      hook2.unmount()
      hook3.unmount()
      hook4.unmount()
      hook5.unmount()
    })

    it('should track only once when multiple hook instances mount with different banner types simultaneously', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Simulate Dashboard, FirstSteps, Settings, and other components mounting simultaneously
      const hooks = [
        renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
          initialReduxState,
        }),
        renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.NoBalanceCheck), {
          initialReduxState,
        }),
        renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Settings), {
          initialReduxState,
        }),
        renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
          initialReduxState,
        }),
        renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.NoBalanceCheck), {
          initialReduxState,
        }),
      ]

      await waitFor(() => {
        // Should only track once from Promo or Settings (NoBalanceCheck doesn't track)
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Cleanup
      hooks.forEach((hook) => hook.unmount())
    })

    it('should track only once even when hooks mount in rapid succession', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Mount first hook
      const hook1 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      // Immediately mount second hook before first completes
      const hook2 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      // Mount third hook
      const hook3 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      await waitFor(() => {
        // Should only track once despite rapid succession
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Cleanup
      hook1.unmount()
      hook2.unmount()
      hook3.unmount()
    })

    it('should prevent tracking when one instance already acquired the lock', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const safeKey = `${chainId}:${safeAddress}`

      // First instance acquires lock
      activeTrackingSafes.add(safeKey)

      // Second instance tries to track
      const hook1 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      // Third instance tries to track
      const hook2 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      await waitFor(() => {
        // Should not track because lock is already acquired
        expect(mockTrackEvent).not.toHaveBeenCalled()
      })

      // Release lock
      activeTrackingSafes.delete(safeKey)

      // Cleanup
      hook1.unmount()
      hook2.unmount()
    })
  })

  describe('Root cause mitigation: Object reference changes', () => {
    it('should not re-track when visibilityResult object reference changes but values remain the same', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(
        ({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult, BannerType.Promo),
        {
          initialProps: { visibilityResult: eligibleVisibilityResult },
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Change object reference but keep same values (simulates useBannerVisibility returning new object)
      rerender({ visibilityResult: { ...eligibleVisibilityResult } })
      rerender({ visibilityResult: { showBanner: true, loading: false } })
      rerender({ visibilityResult: Object.assign({}, eligibleVisibilityResult) })

      await waitFor(() => {
        // Should not track again despite object reference changes
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should not re-track when safeHnState object reference changes but bannerEligibilityTracked remains the same', async () => {
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

      const { rerender } = renderHook(
        () => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo),
        {
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Redux state was updated by the hook (bannerEligibilityTracked is now true)
      // Rerender to simulate state object reference change
      rerender()

      await waitFor(() => {
        // Should not track again despite state object reference change
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should not re-track when safe object reference changes but deployed property remains the same', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { deployed: false } as any,
        safeAddress,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      // Use Promo banner type instead of NoBalanceCheck (which doesn't track)
      const { rerender } = renderHook(
        () => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo),
        {
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Change safe object reference but keep deployed property the same
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: { deployed: false, threshold: 1 } as any, // New object, same deployed value
        safeAddress,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      rerender()

      await waitFor(() => {
        // Should not track again despite safe object reference change
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Root cause mitigation: Dependency array stability', () => {
    it('should not re-track when primitive dependencies change but tracking conditions remain the same', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(
        ({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult, BannerType.Promo),
        {
          initialProps: { visibilityResult: eligibleVisibilityResult },
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Change showBanner from true to true (same value, but could trigger if not properly extracted)
      rerender({ visibilityResult: { showBanner: true, loading: false } })

      await waitFor(() => {
        // Should not track again
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should use session-level ref to prevent re-tracking on re-renders', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(
        () => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo),
        {
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Force multiple re-renders
      rerender()
      rerender()
      rerender()
      rerender()

      await waitFor(() => {
        // Should not track again due to session-level ref
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should reset session-level ref when Safe changes', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Track for first Safe
      const { rerender } = renderHook(
        () => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo),
        {
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
        expect(mockTrackEvent).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
        })
      })

      // Switch to different Safe
      jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
        safe: {} as any,
        safeAddress: otherSafeAddress,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      rerender()

      await waitFor(() => {
        // Should track for new Safe (session ref was reset)
        expect(mockTrackEvent).toHaveBeenCalledTimes(2)
        expect(mockTrackEvent).toHaveBeenLastCalledWith(HYPERNATIVE_EVENTS.GUARDIAN_BANNER_VIEWED, {
          [MixpanelEventParams.SAFE_ADDRESS]: otherSafeAddress,
          [MixpanelEventParams.BLOCKCHAIN_NETWORK]: chainId,
        })
      })
    })
  })

  describe('Root cause mitigation: Race conditions with Redux state', () => {
    it('should check both selector value and current store state to prevent race conditions', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // First instance starts tracking
      const hook1 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      // Before first instance completes, second instance checks state
      // This simulates the race condition where Redux state hasn't updated yet
      const hook2 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      await waitFor(() => {
        // Should only track once despite race condition
        // The activeTrackingSafes Set should prevent the second instance from tracking
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      hook1.unmount()
      hook2.unmount()
    })

    it('should handle case where Redux state is updated but selector returns stale value', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const hook1 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Simulate a scenario where Redux state was updated but selector might return stale value
      // Second instance should check current store state directly
      const hook2 = renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.Promo), {
        initialReduxState: {
          hnState: {
            [`${chainId}:${safeAddress}`]: {
              bannerDismissed: false,
              formCompleted: false,
              pendingBannerDismissed: false,
              bannerEligibilityTracked: true, // State was updated
            },
          } as HnState,
        },
      })

      await waitFor(() => {
        // Should not track again because state check should find bannerEligibilityTracked: true
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      hook1.unmount()
      hook2.unmount()
    })
  })

  describe('Root cause mitigation: visibilityResult object changes from useBannerVisibility', () => {
    it('should not re-track when useBannerVisibility dependencies change but showBanner stays true', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(
        ({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult, BannerType.Promo),
        {
          initialProps: { visibilityResult: eligibleVisibilityResult },
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Simulate useBannerVisibility returning new object when balances.fiatTotal changes
      // but showBanner remains true
      rerender({ visibilityResult: { showBanner: true, loading: false } })
      rerender({ visibilityResult: { showBanner: true, loading: false } })
      rerender({ visibilityResult: { showBanner: true, loading: false } })

      await waitFor(() => {
        // Should not track again despite multiple object reference changes
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle rapid visibilityResult changes without duplicate tracking', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(
        ({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult, BannerType.Promo),
        {
          initialProps: { visibilityResult: eligibleVisibilityResult },
          initialReduxState,
        },
      )

      // Rapidly change visibilityResult object (simulating useBannerVisibility re-computing)
      for (let i = 0; i < 10; i++) {
        rerender({ visibilityResult: { showBanner: true, loading: false } })
      }

      await waitFor(() => {
        // Should only track once despite 10+ object reference changes
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
    })
  })
})
