import { SignerTrackingStrategy } from '../SignerTrackingStrategy'
import { trackEvent } from '@/src/services/analytics'
import { createSignerAddedEvent } from '@/src/services/analytics/events/signers'
import { selectTotalSignerCount } from '@/src/store/signersSlice'
import { EventType } from '@/src/services/analytics/types'
import { ActionWithPayload } from '@/src/store/utils/strategy/Strategy'
import { MiddlewareAPI, Dispatch } from 'redux'
import { RootState } from '@/src/store'

jest.mock('@/src/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/src/services/analytics/events/signers', () => ({
  createSignerAddedEvent: jest.fn(),
}))

jest.mock('@/src/store/signersSlice', () => ({
  selectTotalSignerCount: jest.fn(),
}))

describe('SignerTrackingStrategy', () => {
  let strategy: SignerTrackingStrategy
  let mockStore: MiddlewareAPI<Dispatch, RootState>
  let mockTrackEvent: jest.MockedFunction<typeof trackEvent>
  let mockCreateSignerAddedEvent: jest.MockedFunction<typeof createSignerAddedEvent>
  let mockSelectTotalSignerCount: jest.MockedFunction<typeof selectTotalSignerCount>

  const mockState = {
    signers: {
      '0x123': { value: '0x123', name: 'Signer 1' },
      '0x456': { value: '0x456', name: 'Signer 2' },
    },
  } as unknown as RootState

  beforeEach(() => {
    strategy = new SignerTrackingStrategy()
    mockStore = {
      getState: jest.fn().mockReturnValue(mockState),
      dispatch: jest.fn(),
    }
    mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>
    mockCreateSignerAddedEvent = createSignerAddedEvent as jest.MockedFunction<typeof createSignerAddedEvent>
    mockSelectTotalSignerCount = selectTotalSignerCount as jest.MockedFunction<typeof selectTotalSignerCount>

    jest.clearAllMocks()

    // Setup default mock returns
    mockSelectTotalSignerCount.mockReturnValue(2)
    mockCreateSignerAddedEvent.mockReturnValue({
      eventName: EventType.META,
      eventCategory: 'signers',
      eventAction: 'Signer added',
      eventLabel: '2',
    })
    mockTrackEvent.mockResolvedValue(undefined)
  })

  describe('execute', () => {
    it('should track signer addition when action type is signers/addSigner', () => {
      const action: ActionWithPayload = {
        type: 'signers/addSigner',
        payload: { value: '0x789', name: 'New Signer' },
      }

      strategy.execute(mockStore, action)

      expect(mockSelectTotalSignerCount).toHaveBeenCalledWith(mockState)
      expect(mockCreateSignerAddedEvent).toHaveBeenCalledWith(2)
      expect(mockTrackEvent).toHaveBeenCalledWith({
        eventName: EventType.META,
        eventCategory: 'signers',
        eventAction: 'Signer added',
        eventLabel: '2',
      })
    })

    it('should not track when action type is not signers/addSigner', () => {
      const action: ActionWithPayload = {
        type: 'some/otherAction',
        payload: {},
      }

      strategy.execute(mockStore, action)

      expect(mockSelectTotalSignerCount).not.toHaveBeenCalled()
      expect(mockCreateSignerAddedEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should handle different signer counts correctly', () => {
      // Test with 1 signer
      mockSelectTotalSignerCount.mockReturnValue(1)
      mockCreateSignerAddedEvent.mockReturnValue({
        eventName: EventType.META,
        eventCategory: 'signers',
        eventAction: 'Signer added',
        eventLabel: '1',
      })

      const action: ActionWithPayload = {
        type: 'signers/addSigner',
        payload: { value: '0x123', name: 'First Signer' },
      }

      strategy.execute(mockStore, action)

      expect(mockCreateSignerAddedEvent).toHaveBeenCalledWith(1)
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventLabel: '1',
        }),
      )
    })

    it('should handle tracking errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockTrackEvent.mockRejectedValue(new Error('Tracking failed'))

      const action: ActionWithPayload = {
        type: 'signers/addSigner',
        payload: { value: '0x789', name: 'New Signer' },
      }

      strategy.execute(mockStore, action)

      expect(mockTrackEvent).toHaveBeenCalled()
      // Wait for the async error handling
      setImmediate(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[SignerTrackingStrategy] Error tracking signer addition event:',
          expect.any(Error),
        )
      })

      consoleSpy.mockRestore()
    })

    it('should handle selector errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockSelectTotalSignerCount.mockImplementation(() => {
        throw new Error('Selector failed')
      })

      const action: ActionWithPayload = {
        type: 'signers/addSigner',
        payload: { value: '0x789', name: 'New Signer' },
      }

      strategy.execute(mockStore, action)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SignerTrackingStrategy] Error in trackSignerAddition:',
        expect.any(Error),
      )
      expect(mockTrackEvent).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle zero signers correctly', () => {
      mockSelectTotalSignerCount.mockReturnValue(0)
      mockCreateSignerAddedEvent.mockReturnValue({
        eventName: EventType.META,
        eventCategory: 'signers',
        eventAction: 'Signer added',
        eventLabel: '0',
      })

      const action: ActionWithPayload = {
        type: 'signers/addSigner',
        payload: { value: '0x123', name: 'First Signer' },
      }

      strategy.execute(mockStore, action)

      expect(mockCreateSignerAddedEvent).toHaveBeenCalledWith(0)
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventLabel: '0',
        }),
      )
    })

    it('should handle large signer counts correctly', () => {
      const largeCount = 150
      mockSelectTotalSignerCount.mockReturnValue(largeCount)
      mockCreateSignerAddedEvent.mockReturnValue({
        eventName: EventType.META,
        eventCategory: 'signers',
        eventAction: 'Signer added',
        eventLabel: largeCount.toString(),
      })

      const action: ActionWithPayload = {
        type: 'signers/addSigner',
        payload: { value: '0x789', name: 'Signer 150' },
      }

      strategy.execute(mockStore, action)

      expect(mockCreateSignerAddedEvent).toHaveBeenCalledWith(largeCount)
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventLabel: largeCount.toString(),
        }),
      )
    })
  })
})
