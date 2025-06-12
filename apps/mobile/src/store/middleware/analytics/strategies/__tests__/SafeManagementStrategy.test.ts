import { SafeManagementStrategy } from '../SafeManagementStrategy'
import { RootState } from '@/src/store'
import { MiddlewareAPI, Dispatch } from 'redux'
import * as firebaseAnalytics from '@/src/services/analytics/firebaseAnalytics'
import { createSafeAddedEvent, createSafeRemovedEvent } from '@/src/services/analytics/events/safes'
import { Address } from '@/src/types/address'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

// Mock Firebase Analytics
jest.mock('@/src/services/analytics/firebaseAnalytics')
const mockTrackEvent = firebaseAnalytics.trackEvent as jest.MockedFunction<typeof firebaseAnalytics.trackEvent>

// Mock the event creation functions
jest.mock('@/src/services/analytics/events/safes')
const mockCreateSafeAddedEvent = createSafeAddedEvent as jest.MockedFunction<typeof createSafeAddedEvent>
const mockCreateSafeRemovedEvent = createSafeRemovedEvent as jest.MockedFunction<typeof createSafeRemovedEvent>

describe('SafeManagementStrategy', () => {
  let strategy: SafeManagementStrategy
  let mockStore: MiddlewareAPI<Dispatch, RootState>
  let mockGetState: jest.Mock

  const mockSafeOverview: SafeOverview = {
    address: { value: '0x123', name: null, logoUri: null },
    chainId: '1',
    threshold: 1,
    owners: [{ value: '0xowner1', name: null, logoUri: null }],
    fiatTotal: '100',
    queued: 0,
    awaitingConfirmation: null,
  }

  beforeEach(() => {
    strategy = new SafeManagementStrategy()
    mockGetState = jest.fn()
    mockStore = {
      getState: mockGetState,
      dispatch: jest.fn(),
    }

    // Reset all mocks
    jest.clearAllMocks()
  })

  describe('addSafe action tracking', () => {
    it('should track safe addition with correct total count', () => {
      const mockState: Partial<RootState> = {
        safes: {
          '0x123': { '1': mockSafeOverview },
          '0x456': { '1': mockSafeOverview },
        },
      }
      mockGetState.mockReturnValue(mockState)

      const mockEvent = { eventName: 'metadata', eventCategory: 'safes', eventAction: 'Safe added', eventLabel: 2 }
      mockCreateSafeAddedEvent.mockReturnValue(mockEvent)

      const action = {
        type: 'safes/addSafe',
        payload: { address: '0x789' as Address, info: { '1': mockSafeOverview } },
      }

      strategy.execute(mockStore, action, {} as RootState)

      expect(mockCreateSafeAddedEvent).toHaveBeenCalledWith(2)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEvent)
    })

    it('should track safe addition with count 1 when first safe is added', () => {
      const mockState: Partial<RootState> = {
        safes: {
          '0x123': { '1': mockSafeOverview },
        },
      }
      mockGetState.mockReturnValue(mockState)

      const mockEvent = { eventName: 'metadata', eventCategory: 'safes', eventAction: 'Safe added', eventLabel: 1 }
      mockCreateSafeAddedEvent.mockReturnValue(mockEvent)

      const action = {
        type: 'safes/addSafe',
        payload: { address: '0x123' as Address, info: { '1': mockSafeOverview } },
      }

      strategy.execute(mockStore, action, {} as RootState)

      expect(mockCreateSafeAddedEvent).toHaveBeenCalledWith(1)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEvent)
    })

    it('should track safe addition with count 0 when state is empty', () => {
      const mockState: Partial<RootState> = {
        safes: {},
      }
      mockGetState.mockReturnValue(mockState)

      const mockEvent = { eventName: 'metadata', eventCategory: 'safes', eventAction: 'Safe added', eventLabel: 0 }
      mockCreateSafeAddedEvent.mockReturnValue(mockEvent)

      const action = {
        type: 'safes/addSafe',
        payload: { address: '0x123' as Address, info: { '1': mockSafeOverview } },
      }

      strategy.execute(mockStore, action, {} as RootState)

      expect(mockCreateSafeAddedEvent).toHaveBeenCalledWith(0)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEvent)
    })
  })

  describe('removeSafe action tracking', () => {
    it('should track safe removal with correct total count', () => {
      const mockState: Partial<RootState> = {
        safes: {
          '0x456': { '1': mockSafeOverview },
        },
      }
      mockGetState.mockReturnValue(mockState)

      const mockEvent = { eventName: 'metadata', eventCategory: 'safes', eventAction: 'Safe removed', eventLabel: 1 }
      mockCreateSafeRemovedEvent.mockReturnValue(mockEvent)

      const action = {
        type: 'safes/removeSafe',
        payload: '0x123' as Address,
      }

      strategy.execute(mockStore, action, {} as RootState)

      expect(mockCreateSafeRemovedEvent).toHaveBeenCalledWith(1)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEvent)
    })

    it('should track safe removal with count 0 when all safes are removed', () => {
      const mockState: Partial<RootState> = {
        safes: {},
      }
      mockGetState.mockReturnValue(mockState)

      const mockEvent = { eventName: 'metadata', eventCategory: 'safes', eventAction: 'Safe removed', eventLabel: 0 }
      mockCreateSafeRemovedEvent.mockReturnValue(mockEvent)

      const action = {
        type: 'safes/removeSafe',
        payload: '0x123' as Address,
      }

      strategy.execute(mockStore, action, {} as RootState)

      expect(mockCreateSafeRemovedEvent).toHaveBeenCalledWith(0)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEvent)
    })

    it('should track safe removal correctly with multiple remaining safes', () => {
      const mockState: Partial<RootState> = {
        safes: {
          '0x123': { '1': mockSafeOverview },
          '0x456': { '1': mockSafeOverview },
          '0x789': { '1': mockSafeOverview },
        },
      }
      mockGetState.mockReturnValue(mockState)

      const mockEvent = { eventName: 'metadata', eventCategory: 'safes', eventAction: 'Safe removed', eventLabel: 3 }
      mockCreateSafeRemovedEvent.mockReturnValue(mockEvent)

      const action = {
        type: 'safes/removeSafe',
        payload: '0xabc' as Address,
      }

      strategy.execute(mockStore, action, {} as RootState)

      expect(mockCreateSafeRemovedEvent).toHaveBeenCalledWith(3)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEvent)
    })
  })

  describe('irrelevant action handling', () => {
    it('should not track events for unrelated actions', () => {
      const mockState: Partial<RootState> = {
        safes: { '0x123': { '1': mockSafeOverview } },
      }
      mockGetState.mockReturnValue(mockState)

      const action = {
        type: 'some/other/action',
        payload: {},
      }

      strategy.execute(mockStore, action, {} as RootState)

      expect(mockCreateSafeAddedEvent).not.toHaveBeenCalled()
      expect(mockCreateSafeRemovedEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track events for updateSafeInfo actions', () => {
      const mockState: Partial<RootState> = {
        safes: { '0x123': { '1': mockSafeOverview } },
      }
      mockGetState.mockReturnValue(mockState)

      const action = {
        type: 'safes/updateSafeInfo',
        payload: { address: '0x123' as Address, chainId: '1', info: mockSafeOverview },
      }

      strategy.execute(mockStore, action, {} as RootState)

      expect(mockCreateSafeAddedEvent).not.toHaveBeenCalled()
      expect(mockCreateSafeRemovedEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track events for setSafes actions', () => {
      const mockState: Partial<RootState> = {
        safes: { '0x123': { '1': mockSafeOverview } },
      }
      mockGetState.mockReturnValue(mockState)

      const action = {
        type: 'safes/setSafes',
        payload: { '0x123': { '1': mockSafeOverview } },
      }

      strategy.execute(mockStore, action, {} as RootState)

      expect(mockCreateSafeAddedEvent).not.toHaveBeenCalled()
      expect(mockCreateSafeRemovedEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle errors gracefully and not throw', () => {
      const mockState: Partial<RootState> = {
        safes: { '0x123': { '1': mockSafeOverview } },
      }
      mockGetState.mockReturnValue(mockState)

      // Mock trackEvent to throw an error
      mockTrackEvent.mockImplementation(() => {
        throw new Error('Firebase error')
      })

      const mockEvent = { eventName: 'metadata', eventCategory: 'safes', eventAction: 'Safe added', eventLabel: 1 }
      mockCreateSafeAddedEvent.mockReturnValue(mockEvent)

      const action = {
        type: 'safes/addSafe',
        payload: { address: '0x789' as Address, info: { '1': mockSafeOverview } },
      }

      // Should not throw
      expect(() => {
        strategy.execute(mockStore, action, {} as RootState)
      }).not.toThrow()

      expect(mockCreateSafeAddedEvent).toHaveBeenCalled()
      expect(mockTrackEvent).toHaveBeenCalled()
    })

    it('should handle errors when event creation fails', () => {
      const mockState: Partial<RootState> = {
        safes: { '0x123': { '1': mockSafeOverview } },
      }
      mockGetState.mockReturnValue(mockState)

      // Mock event creation to throw an error
      mockCreateSafeAddedEvent.mockImplementation(() => {
        throw new Error('Event creation error')
      })

      const action = {
        type: 'safes/addSafe',
        payload: { address: '0x789' as Address, info: { '1': mockSafeOverview } },
      }

      // Should not throw
      expect(() => {
        strategy.execute(mockStore, action, {} as RootState)
      }).not.toThrow()

      expect(mockCreateSafeAddedEvent).toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should handle errors when getState fails', () => {
      // Mock getState to throw an error
      mockGetState.mockImplementation(() => {
        throw new Error('State access error')
      })

      const action = {
        type: 'safes/addSafe',
        payload: { address: '0x789' as Address, info: { '1': mockSafeOverview } },
      }

      // Should not throw
      expect(() => {
        strategy.execute(mockStore, action, {} as RootState)
      }).not.toThrow()

      expect(mockCreateSafeAddedEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })
  })
})
