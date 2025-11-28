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

    it('should track when bannerType is NoBalanceCheck', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      renderHook(() => useTrackBannerEligibilityOnConnect(eligibleVisibilityResult, BannerType.NoBalanceCheck), {
        initialReduxState,
      })

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
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
        // Should only track once despite two different banner types
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
        // Should only track once despite three different banner types
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

    it('should not track again when switching from NoBalanceCheck to Promo banner type', async () => {
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

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Switch to Promo banner type
      rerender({ bannerType: BannerType.Promo })

      await waitFor(() => {
        // Should not track again because already tracked
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

    it('should track when visibility changes from false to true for Promo banner and the banner was not tracked yet', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      const { rerender } = renderHook(
        ({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult, BannerType.Promo),
        {
          initialProps: { visibilityResult: ineligibleVisibilityResult },
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

      // Change visibility to true
      rerender({ visibilityResult: eligibleVisibilityResult })

      await waitFor(() => {
        // Should track now
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })
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

    it('should track once per Safe when NoBalanceCheck banner is used on multiple Safes', async () => {
      const initialReduxState: Partial<RootState> = {
        hnState: {},
      }

      // Track for first Safe with NoBalanceCheck
      const { rerender } = renderHook(
        ({ visibilityResult }) => useTrackBannerEligibilityOnConnect(visibilityResult, BannerType.NoBalanceCheck),
        {
          initialProps: { visibilityResult: eligibleVisibilityResult },
          initialReduxState,
        },
      )

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
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
      })
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
        // Should only track once despite three concurrent attempts
        expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      })

      // Cleanup
      hooks.forEach((hook) => hook.unmount())
    })
  })
})
