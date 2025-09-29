import { createMyAccountsScreenViewEvent, createMyAccountsEditModeEvent, createSafeReorderEvent } from '../overview'
import { EventType } from '../../types'

describe('overview events', () => {
  describe('createMyAccountsScreenViewEvent', () => {
    it('should create correct event structure with safe count', () => {
      const totalSafeCount = 5
      const event = createMyAccountsScreenViewEvent(totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.SCREEN_VIEW,
        eventCategory: 'overview',
        eventAction: 'My accounts screen viewed',
        eventLabel: 5,
      })
    })

    it('should handle zero safe count', () => {
      const totalSafeCount = 0
      const event = createMyAccountsScreenViewEvent(totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.SCREEN_VIEW,
        eventCategory: 'overview',
        eventAction: 'My accounts screen viewed',
        eventLabel: 0,
      })
    })

    it('should handle large safe counts', () => {
      const totalSafeCount = 100
      const event = createMyAccountsScreenViewEvent(totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.SCREEN_VIEW,
        eventCategory: 'overview',
        eventAction: 'My accounts screen viewed',
        eventLabel: 100,
      })
    })
  })

  describe('createMyAccountsEditModeEvent', () => {
    it('should create correct event for entering edit mode', () => {
      const totalSafeCount = 3
      const event = createMyAccountsEditModeEvent(true, totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.META,
        eventCategory: 'overview',
        eventAction: 'Edit mode entered',
        eventLabel: 3,
      })
    })

    it('should create correct event for exiting edit mode', () => {
      const totalSafeCount = 7
      const event = createMyAccountsEditModeEvent(false, totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.META,
        eventCategory: 'overview',
        eventAction: 'Edit mode exited',
        eventLabel: 7,
      })
    })

    it('should handle zero safe count for edit mode changes', () => {
      const totalSafeCount = 0
      const enterEvent = createMyAccountsEditModeEvent(true, totalSafeCount)
      const exitEvent = createMyAccountsEditModeEvent(false, totalSafeCount)

      expect(enterEvent.eventLabel).toBe(0)
      expect(exitEvent.eventLabel).toBe(0)
    })

    it('should handle different safe counts for edit mode tracking', () => {
      const enterEvent = createMyAccountsEditModeEvent(true, 50)
      const exitEvent = createMyAccountsEditModeEvent(false, 50)

      expect(enterEvent.eventAction).toBe('Edit mode entered')
      expect(exitEvent.eventAction).toBe('Edit mode exited')
      expect(enterEvent.eventLabel).toBe(50)
      expect(exitEvent.eventLabel).toBe(50)
    })
  })

  describe('createSafeReorderEvent', () => {
    it('should create correct event for safe reordering', () => {
      const totalSafeCount = 5
      const event = createSafeReorderEvent(totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.META,
        eventCategory: 'overview',
        eventAction: 'Safe reordered',
        eventLabel: 5,
      })
    })

    it('should handle zero safe count for reordering', () => {
      const totalSafeCount = 0
      const event = createSafeReorderEvent(totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.META,
        eventCategory: 'overview',
        eventAction: 'Safe reordered',
        eventLabel: 0,
      })
    })

    it('should handle large safe counts for reordering', () => {
      const totalSafeCount = 100
      const event = createSafeReorderEvent(totalSafeCount)

      expect(event).toEqual({
        eventName: EventType.META,
        eventCategory: 'overview',
        eventAction: 'Safe reordered',
        eventLabel: 100,
      })
    })

    it('should use META event type for reordering tracking', () => {
      const event = createSafeReorderEvent(10)

      expect(event.eventName).toBe(EventType.META)
      expect(event.eventCategory).toBe('overview')
      expect(event.eventAction).toBe('Safe reordered')
    })
  })
})
