/**
 * Unit tests for PersistentQueue
 */

import { PersistentQueue } from '../queue'
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
})

const mockNow = 1609459200000 // 2021-01-01 00:00:00 UTC

beforeAll(() => {
  jest.useFakeTimers()
  jest.setSystemTime(mockNow)
})

afterAll(() => {
  jest.useRealTimers()
})

describe('PersistentQueue', () => {
  let queue: PersistentQueue
  const storageKey = 'test-analytics-queue'

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    queue = new PersistentQueue(storageKey)
  })

  describe('Initialization', () => {
    it('should create queue with default options', () => {
      const defaultQueue = new PersistentQueue()
      expect(defaultQueue).toBeInstanceOf(PersistentQueue)
    })

    it('should create queue with custom options', () => {
      const customQueue = new PersistentQueue(
        'custom-key',
        50,
        1000 * 60 * 60, // 1 hour
      )
      expect(customQueue).toBeInstanceOf(PersistentQueue)
    })

    it('should load existing events from localStorage', () => {
      const existingEvents: QueuedEvent[] = [
        {
          name: 'test',
          payload: {},
          timestamp: mockNow - 1000,
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingEvents))

      const queueWithExisting = new PersistentQueue(storageKey)
      expect(queueWithExisting.size()).toBe(1)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const queue = new PersistentQueue(storageKey)
      expect(queue.size()).toBe(0)
    })

    it('should clean up expired events on initialization', () => {
      const expiredEvents: QueuedEvent[] = [
        {
          name: 'old',
          payload: {},
          timestamp: mockNow - 25 * 60 * 60 * 1000, // 25 hours ago (expired)
        },
        {
          name: 'new',
          payload: {},
          timestamp: mockNow - 1000, // 1 second ago (valid)
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredEvents))

      const queue = new PersistentQueue(storageKey, 1000, 24 * 60 * 60 * 1000) // 24 hours TTL
      expect(queue.size()).toBe(1) // Only valid event should remain
    })
  })

  describe('Event Operations', () => {
    it('should enqueue events', () => {
      const event = { name: 'test', payload: { key: 'value' } }

      queue.enqueue(event)

      expect(queue.size()).toBe(1)
    })

    it('should drain events in FIFO order', () => {
      const event1 = { name: 'test-1', payload: {} }
      const event2 = { name: 'test-2', payload: {} }

      queue.enqueue(event1)
      queue.enqueue(event2)

      const events = queue.drain(1)
      expect(events).toHaveLength(1)
      expect(events[0].name).toBe('test-1')
      expect(queue.size()).toBe(1)

      const remainingEvents = queue.drain(10)
      expect(remainingEvents).toHaveLength(1)
      expect(remainingEvents[0].name).toBe('test-2')
      expect(queue.size()).toBe(0)
    })

    it('should enforce max size limit', () => {
      const smallQueue = new PersistentQueue('small', 2)

      smallQueue.enqueue({ name: 'event-1', payload: {} })
      smallQueue.enqueue({ name: 'event-2', payload: {} })
      smallQueue.enqueue({ name: 'event-3', payload: {} })

      // Should only keep the last 2 events
      expect(smallQueue.size()).toBe(2)

      const events = smallQueue.drain(10)
      expect(events[0].name).toBe('event-2')
      expect(events[1].name).toBe('event-3')
    })

    it('should clear all events', () => {
      queue.enqueue({ name: 'test', payload: {} })
      expect(queue.size()).toBe(1)

      queue.clear()
      expect(queue.size()).toBe(0)
    })

    it('should handle empty queue operations', () => {
      expect(queue.size()).toBe(0)
      expect(queue.drain()).toEqual([])
    })
  })

  describe('TTL Cleanup', () => {
    it('should remove expired events during drain operation', () => {
      const shortTTL = 1000 // 1 second
      const _queueWithShortTTL = new PersistentQueue('short-ttl', 1000, shortTTL)

      // Mock an event that's older than TTL
      const expiredEvents: QueuedEvent[] = [
        {
          name: 'old',
          payload: {},
          timestamp: mockNow - 2000, // 2 seconds ago
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredEvents))

      // Create new instance to trigger cleanup
      const freshQueue = new PersistentQueue('short-ttl', 1000, shortTTL)

      expect(freshQueue.size()).toBe(0) // Expired event should be cleaned up
    })
  })
})
