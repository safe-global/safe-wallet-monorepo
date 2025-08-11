/**
 * Unit tests for AnalyticsQueue
 */

import { AnalyticsQueue } from '../queue'
import type { QueuedEvent } from '../types'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock Date.now for predictable timestamps
const mockNow = 1640995200000 // 2022-01-01 00:00:00 UTC
jest.spyOn(Date, 'now').mockReturnValue(mockNow)

describe('AnalyticsQueue', () => {
  let queue: AnalyticsQueue
  const storageKey = 'test-analytics-queue'

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    queue = new AnalyticsQueue({ storageKey })
  })

  describe('Initialization', () => {
    it('should create queue with default options', () => {
      const defaultQueue = new AnalyticsQueue()
      expect(defaultQueue).toBeInstanceOf(AnalyticsQueue)
    })

    it('should create queue with custom options', () => {
      const customQueue = new AnalyticsQueue({
        storageKey: 'custom-key',
        maxSize: 50,
        ttl: 1000 * 60 * 60, // 1 hour
      })
      expect(customQueue).toBeInstanceOf(AnalyticsQueue)
    })

    it('should load existing events from localStorage', () => {
      const existingEvents: QueuedEvent[] = [
        {
          id: 'event-1',
          event: { name: 'test', payload: {} },
          timestamp: mockNow - 1000,
          attempts: 0,
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingEvents))

      const queueWithExisting = new AnalyticsQueue({ storageKey })
      expect(queueWithExisting.size()).toBe(1)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json')

      // Should not throw
      expect(() => new AnalyticsQueue({ storageKey })).not.toThrow()

      const queue = new AnalyticsQueue({ storageKey })
      expect(queue.size()).toBe(0)
    })

    it('should clean up expired events on initialization', () => {
      const expiredEvents: QueuedEvent[] = [
        {
          id: 'expired-1',
          event: { name: 'old', payload: {} },
          timestamp: mockNow - (25 * 60 * 60 * 1000), // 25 hours ago (expired)
          attempts: 0,
        },
        {
          id: 'valid-1',
          event: { name: 'new', payload: {} },
          timestamp: mockNow - 1000, // 1 second ago (valid)
          attempts: 0,
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredEvents))

      const queue = new AnalyticsQueue({ storageKey, ttl: 24 * 60 * 60 * 1000 }) // 24 hours TTL
      expect(queue.size()).toBe(1) // Only valid event should remain
    })
  })

  describe('Adding Events', () => {
    it('should add events to queue', () => {
      const event = { name: 'test-event', payload: { data: 'test' } }

      queue.enqueue(event)

      expect(queue.size()).toBe(1)
    })

    it('should persist events to localStorage', () => {
      const event = { name: 'test-event', payload: { data: 'test' } }

      queue.enqueue(event)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        storageKey,
        expect.stringContaining('test-event'),
      )
    })

    it('should assign unique IDs to events', () => {
      const event = { name: 'test', payload: {} }

      queue.enqueue(event)
      queue.enqueue(event)

      const events = queue.getAll()
      expect(events[0].id).toBeDefined()
      expect(events[1].id).toBeDefined()
      expect(events[0].id).not.toBe(events[1].id)
    })

    it('should add timestamps to events', () => {
      const event = { name: 'test', payload: {} }

      queue.enqueue(event)

      const events = queue.getAll()
      expect(events[0].timestamp).toBe(mockNow)
    })

    it('should initialize attempt count to 0', () => {
      const event = { name: 'test', payload: {} }

      queue.enqueue(event)

      const events = queue.getAll()
      expect(events[0].attempts).toBe(0)
    })

    it('should enforce max size limit', () => {
      const smallQueue = new AnalyticsQueue({ storageKey: 'small', maxSize: 2 })

      smallQueue.enqueue({ name: 'event-1', payload: {} })
      smallQueue.enqueue({ name: 'event-2', payload: {} })
      smallQueue.enqueue({ name: 'event-3', payload: {} })

      // Should only keep the last 2 events
      expect(smallQueue.size()).toBe(2)

      const events = smallQueue.getAll()
      expect(events[0].event.name).toBe('event-2')
      expect(events[1].event.name).toBe('event-3')
    })
  })

  describe('Retrieving Events', () => {
    beforeEach(() => {
      queue.enqueue({ name: 'event-1', payload: {} })
      queue.enqueue({ name: 'event-2', payload: {} })
      queue.enqueue({ name: 'event-3', payload: {} })
    })

    it('should get all events', () => {
      const events = queue.getAll()
      expect(events).toHaveLength(3)
      expect(events[0].event.name).toBe('event-1')
      expect(events[1].event.name).toBe('event-2')
      expect(events[2].event.name).toBe('event-3')
    })

    it('should get events in FIFO order', () => {
      const events = queue.getAll()
      expect(events[0].timestamp).toBeLessThanOrEqual(events[1].timestamp)
      expect(events[1].timestamp).toBeLessThanOrEqual(events[2].timestamp)
    })

    it('should return empty array when queue is empty', () => {
      const emptyQueue = new AnalyticsQueue({ storageKey: 'empty' })
      expect(emptyQueue.getAll()).toEqual([])
    })

    it('should get queue size', () => {
      expect(queue.size()).toBe(3)
    })

    it('should check if queue is empty', () => {
      expect(queue.isEmpty()).toBe(false)

      const emptyQueue = new AnalyticsQueue({ storageKey: 'empty' })
      expect(emptyQueue.isEmpty()).toBe(true)
    })
  })

  describe('Removing Events', () => {
    let eventId: string

    beforeEach(() => {
      queue.enqueue({ name: 'test-event', payload: {} })
      const events = queue.getAll()
      eventId = events[0].id
    })

    it('should remove events by ID', () => {
      expect(queue.size()).toBe(1)

      queue.remove(eventId)

      expect(queue.size()).toBe(0)
    })

    it('should persist changes after removal', () => {
      queue.remove(eventId)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(storageKey, '[]')
    })

    it('should handle removal of non-existent ID gracefully', () => {
      expect(() => queue.remove('non-existent-id')).not.toThrow()
      expect(queue.size()).toBe(1) // Original event should still exist
    })

    it('should clear all events', () => {
      queue.enqueue({ name: 'another-event', payload: {} })
      expect(queue.size()).toBe(2)

      queue.clear()

      expect(queue.size()).toBe(0)
      expect(queue.isEmpty()).toBe(true)
    })
  })

  describe('Retry Logic', () => {
    let eventId: string

    beforeEach(() => {
      queue.enqueue({ name: 'test-event', payload: {} })
      const events = queue.getAll()
      eventId = events[0].id
    })

    it('should increment retry count', () => {
      queue.incrementRetry(eventId)

      const events = queue.getAll()
      expect(events[0].attempts).toBe(1)
    })

    it('should persist retry count changes', () => {
      queue.incrementRetry(eventId)

      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should handle retry increment for non-existent ID', () => {
      expect(() => queue.incrementRetry('non-existent')).not.toThrow()

      const events = queue.getAll()
      expect(events[0].attempts).toBe(0) // Original should be unchanged
    })

    it('should track multiple retry attempts', () => {
      queue.incrementRetry(eventId)
      queue.incrementRetry(eventId)
      queue.incrementRetry(eventId)

      const events = queue.getAll()
      expect(events[0].attempts).toBe(3)
    })
  })

  describe('TTL Management', () => {
    it('should respect custom TTL', () => {
      const shortTTL = 1000 // 1 second
      const queueWithShortTTL = new AnalyticsQueue({
        storageKey: 'short-ttl',
        ttl: shortTTL,
      })

      // Mock an event that's older than TTL
      const expiredEvents: QueuedEvent[] = [
        {
          id: 'expired',
          event: { name: 'old', payload: {} },
          timestamp: mockNow - 2000, // 2 seconds ago
          attempts: 0,
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredEvents))

      // Create new instance to trigger cleanup
      const newQueue = new AnalyticsQueue({
        storageKey: 'short-ttl',
        ttl: shortTTL,
      })

      expect(newQueue.size()).toBe(0)
    })

    it('should clean up expired events periodically', () => {
      // Add a fresh event
      queue.enqueue({ name: 'fresh', payload: {} })

      // Manually add an expired event to localStorage
      const events = queue.getAll()
      events.push({
        id: 'expired',
        event: { name: 'old', payload: {} },
        timestamp: mockNow - (25 * 60 * 60 * 1000), // 25 hours ago
        attempts: 0,
      })

      localStorageMock.getItem.mockReturnValue(JSON.stringify(events))

      // Create new queue instance to trigger cleanup
      const newQueue = new AnalyticsQueue({ storageKey })
      expect(newQueue.size()).toBe(1) // Only fresh event should remain
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage setItem failures', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage full')
      })

      // Should not throw
      expect(() => queue.enqueue({ name: 'test', payload: {} })).not.toThrow()
    })

    it('should handle localStorage getItem failures', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Should create empty queue
      expect(() => new AnalyticsQueue({ storageKey })).not.toThrow()
      const queue = new AnalyticsQueue({ storageKey })
      expect(queue.size()).toBe(0)
    })

    it('should handle malformed JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('{"invalid": json}')

      expect(() => new AnalyticsQueue({ storageKey })).not.toThrow()
      const queue = new AnalyticsQueue({ storageKey })
      expect(queue.size()).toBe(0)
    })

    it('should handle non-array data in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('{"not": "array"}')

      expect(() => new AnalyticsQueue({ storageKey })).not.toThrow()
      const queue = new AnalyticsQueue({ storageKey })
      expect(queue.size()).toBe(0)
    })
  })

  describe('Browser Environment Safety', () => {
    it('should handle missing localStorage gracefully', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = window.localStorage
      delete (window as any).localStorage

      expect(() => new AnalyticsQueue({ storageKey })).not.toThrow()

      // Restore localStorage
      window.localStorage = originalLocalStorage
    })

    it('should work in server-side environment', () => {
      // Mock window being undefined
      const originalWindow = global.window
      delete (global as any).window

      expect(() => new AnalyticsQueue({ storageKey })).not.toThrow()

      // Restore window
      global.window = originalWindow
    })
  })
})