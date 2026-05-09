import { SafeViewedStrategy } from '../SafeViewedStrategy'
import { trackEvent } from '@/src/services/analytics'
import { EventType } from '@/src/services/analytics/types'
import type { RootState } from '@/src/store'
import type { ActionWithPayload } from '@/src/store/utils/strategy/Strategy'
import type { SafeInfo } from '@/src/types/address'
import { MiddlewareAPI, Dispatch } from '@reduxjs/toolkit'

jest.mock('@/src/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

const mockTrackEvent = jest.mocked(trackEvent)

describe('SafeViewedStrategy', () => {
  let strategy: SafeViewedStrategy
  let mockStore: MiddlewareAPI<Dispatch, RootState>
  let mockGetState: jest.Mock
  let prevState: RootState

  beforeEach(() => {
    strategy = new SafeViewedStrategy()
    mockGetState = jest.fn()
    mockStore = {
      dispatch: jest.fn(),
      getState: mockGetState,
    } as unknown as MiddlewareAPI<Dispatch, RootState>

    prevState = {} as RootState

    mockTrackEvent.mockResolvedValue(undefined)
    jest.clearAllMocks()
  })

  describe('setActiveSafe action', () => {
    it('should track safe_viewed event when activeSafe is set with a safe', () => {
      const mockSafeInfo: SafeInfo = {
        address: '0x123',
        chainId: '1',
      }

      const action: ActionWithPayload = {
        type: 'activeSafe/setActiveSafe',
        payload: mockSafeInfo,
      }

      strategy.execute(mockStore, action, prevState)

      expect(mockTrackEvent).toHaveBeenCalledWith({
        eventName: EventType.SAFE_OPENED,
        eventCategory: 'safe',
        eventAction: 'opened',
        eventLabel: 'safe_viewed',
        chainId: '1',
      })
    })

    it('should not track event when activeSafe is set to null', () => {
      const action: ActionWithPayload = {
        type: 'activeSafe/setActiveSafe',
        payload: null,
      }

      strategy.execute(mockStore, action, prevState)

      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should handle tracking errors gracefully', () => {
      const trackingError = new Error('Analytics service unavailable')
      mockTrackEvent.mockRejectedValueOnce(trackingError)

      const mockSafeInfo: SafeInfo = {
        address: '0x123',
        chainId: '1',
      }

      const action: ActionWithPayload = {
        type: 'activeSafe/setActiveSafe',
        payload: mockSafeInfo,
      }

      // Should not throw even if trackEvent rejects
      expect(() => strategy.execute(mockStore, action, prevState)).not.toThrow()

      expect(mockTrackEvent).toHaveBeenCalledWith({
        eventName: EventType.SAFE_OPENED,
        eventCategory: 'safe',
        eventAction: 'opened',
        eventLabel: 'safe_viewed',
        chainId: '1',
      })
    })
  })

  describe('switchActiveChain action', () => {
    it('should track safe_viewed event when switching chains with active safe', () => {
      const mockSafeInfo: SafeInfo = {
        address: '0x456',
        chainId: '137',
      }

      const mockState = {
        activeSafe: mockSafeInfo,
      } as RootState

      mockGetState.mockReturnValue(mockState)

      const action: ActionWithPayload = {
        type: 'activeSafe/switchActiveChain',
        payload: '137',
      }

      strategy.execute(mockStore, action, prevState)

      expect(mockTrackEvent).toHaveBeenCalledWith({
        eventName: EventType.SAFE_OPENED,
        eventCategory: 'safe',
        eventAction: 'opened',
        eventLabel: 'safe_viewed',
        chainId: '137',
      })
    })

    it('should not track event when switching chains with no active safe', () => {
      const mockState = {
        activeSafe: null,
      } as RootState

      mockGetState.mockReturnValue(mockState)

      const action: ActionWithPayload = {
        type: 'activeSafe/switchActiveChain',
        payload: '137',
      }

      strategy.execute(mockStore, action, prevState)

      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should handle tracking errors gracefully on chain switch', () => {
      const trackingError = new Error('Network error')
      mockTrackEvent.mockRejectedValueOnce(trackingError)

      const mockSafeInfo: SafeInfo = {
        address: '0x789',
        chainId: '100',
      }

      const mockState = {
        activeSafe: mockSafeInfo,
      } as RootState

      mockGetState.mockReturnValue(mockState)

      const action: ActionWithPayload = {
        type: 'activeSafe/switchActiveChain',
        payload: '100',
      }

      expect(() => strategy.execute(mockStore, action, prevState)).not.toThrow()

      expect(mockTrackEvent).toHaveBeenCalledWith({
        eventName: EventType.SAFE_OPENED,
        eventCategory: 'safe',
        eventAction: 'opened',
        eventLabel: 'safe_viewed',
        chainId: '100',
      })
    })
  })

  describe('unrelated actions', () => {
    it('should not track events for unrelated actions', () => {
      const action: ActionWithPayload = {
        type: 'someOther/action',
        payload: { data: 'test' },
      }

      strategy.execute(mockStore, action, prevState)

      expect(mockTrackEvent).not.toHaveBeenCalled()
    })
  })
})
