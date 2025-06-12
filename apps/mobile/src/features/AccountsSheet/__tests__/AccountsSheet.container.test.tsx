import {
  createMyAccountsScreenViewEvent,
  createMyAccountsEditModeEvent,
  createSafeReorderEvent,
} from '../../../services/analytics/events/overview'
import { EventType } from '../../../services/analytics/types'

// Mock Firebase Analytics
jest.mock('@/src/services/analytics/firebaseAnalytics')

describe('AccountsSheetContainer tracking', () => {
  describe('My accounts screen view tracking', () => {
    it('should call createMyAccountsScreenViewEvent with correct parameters', () => {
      const totalSafeCount = 3
      const event = createMyAccountsScreenViewEvent(totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.SCREEN_VIEW,
        eventCategory: 'overview',
        eventAction: 'My accounts screen viewed',
        eventLabel: 3,
      })
    })

    it('should handle zero safe count correctly', () => {
      const totalSafeCount = 0
      const event = createMyAccountsScreenViewEvent(totalSafeCount)

      expect(event.eventLabel).toBe(0)
    })
  })

  describe('My accounts edit mode tracking', () => {
    it('should create correct event for entering edit mode', () => {
      const totalSafeCount = 5
      const event = createMyAccountsEditModeEvent(true, totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.META,
        eventCategory: 'overview',
        eventAction: 'Edit mode entered',
        eventLabel: 5,
      })
    })

    it('should create correct event for exiting edit mode', () => {
      const totalSafeCount = 2
      const event = createMyAccountsEditModeEvent(false, totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.META,
        eventCategory: 'overview',
        eventAction: 'Edit mode exited',
        eventLabel: 2,
      })
    })

    it('should track different actions for entering vs exiting edit mode', () => {
      const enterEvent = createMyAccountsEditModeEvent(true, 10)
      const exitEvent = createMyAccountsEditModeEvent(false, 10)

      expect(enterEvent.eventAction).toBe('Edit mode entered')
      expect(exitEvent.eventAction).toBe('Edit mode exited')
      expect(enterEvent.eventName).toBe(EventType.META)
      expect(exitEvent.eventName).toBe(EventType.META)
    })
  })

  describe('My accounts safe reordering tracking', () => {
    it('should create correct event for safe reordering', () => {
      const totalSafeCount = 8
      const event = createSafeReorderEvent(totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.META,
        eventCategory: 'overview',
        eventAction: 'Safe reordered',
        eventLabel: 8,
      })
    })

    it('should track reordering events with different safe counts', () => {
      const smallCountEvent = createSafeReorderEvent(2)
      const largeCountEvent = createSafeReorderEvent(50)

      expect(smallCountEvent.eventLabel).toBe(2)
      expect(largeCountEvent.eventLabel).toBe(50)
      expect(smallCountEvent.eventAction).toBe('Safe reordered')
      expect(largeCountEvent.eventAction).toBe('Safe reordered')
    })

    it('should use META event type for reordering', () => {
      const event = createSafeReorderEvent(15)

      expect(event.eventName).toBe(EventType.META)
      expect(event.eventCategory).toBe('overview')
    })
  })
})
