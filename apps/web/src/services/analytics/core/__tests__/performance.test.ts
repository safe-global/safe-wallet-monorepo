/**
 * Performance and edge case integration tests
 * Tests analytics system performance characteristics and unusual scenarios
 */

// Mock constants before any imports
jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  GA_TRACKING_ID: 'GA-TEST-123',
  MIXPANEL_TOKEN: 'test-token',
  IS_PRODUCTION: false,
}))

// Mock @next/third-parties/google
jest.mock('@next/third-parties/google', () => ({
  sendGAEvent: jest.fn(),
}))

// Mock mixpanel-browser with performance tracking
const mockMixpanel = {
  init: jest.fn(),
  track: jest.fn(),
  identify: jest.fn(),
  register: jest.fn(),
  reset: jest.fn(),
  opt_in_tracking: jest.fn(),
  opt_out_tracking: jest.fn(),
  has_opted_in_tracking: jest.fn().mockReturnValue(true),
  people: {
    set: jest.fn(),
    set_once: jest.fn(),
    increment: jest.fn(),
    append: jest.fn(),
    union: jest.fn(),
  },
}

jest.mock('mixpanel-browser', () => mockMixpanel)

import { AnalyticsBuilder } from '../builder'
import { GoogleAnalyticsProvider } from '../../providers/GoogleAnalyticsProvider'
import { MixpanelProvider } from '../../providers/MixpanelProvider'
import type { BaseProvider, SafeEventMap, AnalyticsEvent, MiddlewareFunction } from '../types'
import type { ProviderId } from '../../providers/constants'
import { PROVIDER } from '../../providers/constants'

// Get mocked instances

// Mock gtag function with timing
const mockGtag = jest.fn()
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
})

// Test event types
type TestEvents = SafeEventMap & {
  high_frequency_event: {
    event_id: string
    timestamp: number
    counter: number
  }
  large_payload_event: {
    large_data: string
    metadata: Record<string, unknown>
    user_data: unknown[]
  }
  edge_case_event: {
    unicode_property: string
    special_chars: string
    nested_object: Record<string, unknown>
  }
}

// Performance measuring provider
class PerformanceTrackingProvider implements BaseProvider<TestEvents> {
  readonly id: ProviderId = PROVIDER.Custom
  private enabled = true

  public trackTimes: number[] = []
  public identifyTimes: number[] = []
  public initTime = 0
  public flushTime = 0
  public shutdownTime = 0

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  init(): void {
    const start = performance.now()
    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      Math.random()
    }
    this.initTime = performance.now() - start
  }

  track(event: AnalyticsEvent): void {
    const start = performance.now()
    // Simulate tracking work
    JSON.stringify(event)
    this.trackTimes.push(performance.now() - start)
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    const start = performance.now()
    // Simulate identify work
    JSON.stringify({ userId, traits })
    this.identifyTimes.push(performance.now() - start)
  }

  async flush(): Promise<void> {
    const start = performance.now()
    await new Promise((resolve) => setTimeout(resolve, 10)) // Simulate async work
    this.flushTime = performance.now() - start
  }

  async shutdown(): Promise<void> {
    const start = performance.now()
    await new Promise((resolve) => setTimeout(resolve, 5))
    this.shutdownTime = performance.now() - start
    this.enabled = false
  }
}

// Batching provider to test event batching
class BatchingProvider implements BaseProvider<TestEvents> {
  readonly id: ProviderId = PROVIDER.Mock
  private enabled = true
  private eventBatch: AnalyticsEvent[] = []
  private batchFlushes: AnalyticsEvent[][] = []

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  init(): void {}

  track(event: AnalyticsEvent): void {
    this.eventBatch.push(event)

    // Simulate batching - flush every 10 events
    if (this.eventBatch.length >= 10) {
      this.flushBatch()
    }
  }

  private flushBatch(): void {
    this.batchFlushes.push([...this.eventBatch])
    this.eventBatch = []
  }

  getBatches(): AnalyticsEvent[][] {
    return this.batchFlushes
  }

  getPendingBatch(): AnalyticsEvent[] {
    return this.eventBatch
  }

  async flush(): Promise<void> {
    if (this.eventBatch.length > 0) {
      this.flushBatch()
    }
  }

  async shutdown(): Promise<void> {
    await this.flush()
    this.enabled = false
  }
}

describe('Performance and Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('High Volume Event Processing', () => {
    it('should handle high-frequency event tracking efficiently', async () => {
      const performanceProvider = new PerformanceTrackingProvider()

      const analytics = AnalyticsBuilder.create()
        .addProvider(performanceProvider)
        .addProvider(new GoogleAnalyticsProvider({ gtag: mockGtag }))
        .addProvider(new MixpanelProvider())
        .withConsent({ analytics: true })
        .build()

      await analytics.init()

      const eventCount = 1000
      const startTime = performance.now()

      // Send many events rapidly
      for (let i = 0; i < eventCount; i++) {
        analytics.track({
          name: 'high_frequency_event',
          payload: {
            event_id: `event-${i}`,
            timestamp: Date.now(),
            counter: i,
          },
        })
      }

      const totalTime = performance.now() - startTime

      // Performance assertions
      expect(performanceProvider.trackTimes).toHaveLength(eventCount)
      expect(totalTime).toBeLessThan(1000) // Should complete in under 1 second

      // Average tracking time should be reasonable
      const avgTrackTime = performanceProvider.trackTimes.reduce((a, b) => a + b, 0) / eventCount
      expect(avgTrackTime).toBeLessThan(1) // Average under 1ms per event

      // All providers should have received events
      expect(mockGtag).toHaveBeenCalledTimes(eventCount)
      expect(mockMixpanel.track).toHaveBeenCalledTimes(eventCount)
    })

    it('should handle burst event processing', async () => {
      const batchingProvider = new BatchingProvider()

      const analytics = AnalyticsBuilder.create().addProvider(batchingProvider).withConsent({ analytics: true }).build()

      await analytics.init()

      // Send burst of events
      const burstEvents = Array.from({ length: 25 }, (_, i) => ({
        name: 'high_frequency_event' as const,
        payload: {
          event_id: `burst-${i}`,
          timestamp: Date.now(),
          counter: i,
        },
      }))

      const startTime = performance.now()
      burstEvents.forEach((event) => analytics.track(event))
      const burstTime = performance.now() - startTime

      expect(burstTime).toBeLessThan(100) // Burst should be fast

      // Should have created batches
      const batches = batchingProvider.getBatches()
      const pendingBatch = batchingProvider.getPendingBatch()

      expect(batches).toHaveLength(2) // 25 events = 2 full batches of 10
      expect(pendingBatch).toHaveLength(5) // 5 remaining events

      batches.forEach((batch) => {
        expect(batch).toHaveLength(10)
      })
    })

    it('should handle concurrent event processing', async () => {
      const performanceProvider = new PerformanceTrackingProvider()

      const analytics = AnalyticsBuilder.create()
        .addProvider(performanceProvider)
        .withConsent({ analytics: true })
        .build()

      await analytics.init()

      // Send events from multiple "threads" concurrently
      const concurrentPromises = Array.from({ length: 10 }, async (_, threadId) => {
        const promises = Array.from(
          { length: 50 },
          (_, eventId) =>
            new Promise<void>((resolve) => {
              setTimeout(() => {
                analytics.track({
                  name: 'high_frequency_event',
                  payload: {
                    event_id: `thread-${threadId}-event-${eventId}`,
                    timestamp: Date.now(),
                    counter: eventId,
                  },
                })
                resolve()
              }, Math.random() * 10) // Random delay up to 10ms
            }),
        )
        return Promise.all(promises)
      })

      const startTime = performance.now()
      await Promise.all(concurrentPromises)
      const totalTime = performance.now() - startTime

      expect(totalTime).toBeLessThan(500) // Should complete reasonably quickly
      expect(performanceProvider.trackTimes).toHaveLength(500) // 10 threads * 50 events
    })
  })

  describe('Large Payload Handling', () => {
    it('should handle events with large payloads', async () => {
      const analytics = AnalyticsBuilder.create()
        .addProvider(new GoogleAnalyticsProvider({ gtag: mockGtag }))
        .addProvider(new MixpanelProvider())
        .withConsent({ analytics: true })
        .build()

      await analytics.init()

      // Create event with large payload
      const largeData = 'A'.repeat(10000) // 10KB string
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: 'x'.repeat(100),
      }))

      const largePayloadEvent: AnalyticsEvent<'large_payload_event', TestEvents['large_payload_event']> = {
        name: 'large_payload_event',
        payload: {
          large_data: largeData,
          metadata: {
            complexity: 'high',
            size: largeData.length,
            timestamp: Date.now(),
            nested: {
              level1: { level2: { level3: 'deep data' } },
            },
          },
          user_data: largeArray,
        },
      }

      const startTime = performance.now()

      // Should not crash with large payload
      expect(() => analytics.track(largePayloadEvent)).not.toThrow()

      const trackTime = performance.now() - startTime
      expect(trackTime).toBeLessThan(50) // Should complete in reasonable time

      // Providers should have received the event
      expect(mockGtag).toHaveBeenCalled()
      expect(mockMixpanel.track).toHaveBeenCalled()
    })

    it('should handle deeply nested object structures', async () => {
      const analytics = AnalyticsBuilder.create()
        .addProvider(new GoogleAnalyticsProvider({ gtag: mockGtag }))
        .withConsent({ analytics: true })
        .build()

      await analytics.init()

      // Create deeply nested structure
      let deepObject: unknown = { value: 'leaf' }
      for (let i = 0; i < 50; i++) {
        deepObject = { [`level_${i}`]: deepObject }
      }

      const deepEvent = {
        name: 'large_payload_event' as const,
        payload: {
          large_data: 'test',
          metadata: deepObject,
          user_data: [],
        },
      }

      // Should handle deep nesting without stack overflow
      expect(() => analytics.track(deepEvent)).not.toThrow()
    })
  })

  describe('Edge Case Event Data', () => {
    it('should handle events with special characters and unicode', async () => {
      const analytics = AnalyticsBuilder.create()
        .addProvider(new GoogleAnalyticsProvider({ gtag: mockGtag }))
        .addProvider(new MixpanelProvider())
        .withConsent({ analytics: true })
        .build()

      await analytics.init()

      const edgeCaseEvent: AnalyticsEvent<'edge_case_event', TestEvents['edge_case_event']> = {
        name: 'edge_case_event',
        payload: {
          unicode_property: '🚀 Safe{Wallet} 中文 العربية русский 🎉',
          special_chars: '!@#$%^&*()_+-=[]{}|;":,./<>?`~\\\'',
          nested_object: {
            'key with spaces': 'value',
            'key-with-dashes': 'value',
            key_with_underscores: 'value',
            CamelCaseKey: 'value',
            PascalCaseKey: 'value',
            UPPER_SNAKE_CASE: 'value',
            '123numeric_key': 'value',
            '': 'empty_key',
            null_value: null,
            undefined_value: undefined,
            boolean_true: true,
            boolean_false: false,
            zero_number: 0,
            negative_number: -123.45,
            large_number: 9007199254740991, // MAX_SAFE_INTEGER
          },
        },
      }

      expect(() => analytics.track(edgeCaseEvent)).not.toThrow()

      // Verify providers received the event
      expect(mockGtag).toHaveBeenCalledWith('event', 'edge_case_event', expect.any(Object))
      expect(mockMixpanel.track).toHaveBeenCalledWith('Edge Case Event', expect.any(Object))

      // Check that special characters were handled properly
      const gaCall = mockGtag.mock.calls.find((call) => call[1] === 'edge_case_event')
      const mixpanelCall = mockMixpanel.track.mock.calls.find((call) => call[0] === 'Edge Case Event')

      expect(gaCall[2]).toHaveProperty('unicode_property')
      expect(gaCall[2]).toHaveProperty('special_chars')
      expect(mixpanelCall[1]).toHaveProperty('Unicode Property')
      expect(mixpanelCall[1]).toHaveProperty('Special Chars')
    })

    it('should handle circular references in event data', async () => {
      const analytics = AnalyticsBuilder.create()
        .addProvider(new GoogleAnalyticsProvider({ gtag: mockGtag }))
        .withConsent({ analytics: true })
        .build()

      await analytics.init()

      // Create circular reference
      const circularObj: Record<string, unknown> = { name: 'circular' }
      ;(circularObj as Record<string, unknown>).self = circularObj

      const eventWithCircular = {
        name: 'edge_case_event' as const,
        payload: {
          unicode_property: 'test',
          special_chars: 'test',
          nested_object: circularObj,
        },
      }

      // Should handle circular references gracefully
      expect(() => analytics.track(eventWithCircular)).not.toThrow()
    })

    it('should handle null and undefined values correctly', async () => {
      const analytics = AnalyticsBuilder.create()
        .addProvider(new GoogleAnalyticsProvider({ gtag: mockGtag }))
        .addProvider(new MixpanelProvider())
        .withConsent({ analytics: true })
        .build()

      await analytics.init()

      const nullUndefinedEvent = {
        name: 'edge_case_event' as const,
        payload: {
          unicode_property: null as unknown,
          special_chars: undefined as unknown,
          nested_object: {
            explicit_null: null,
            explicit_undefined: undefined,
            empty_string: '',
            zero_value: 0,
            false_value: false,
          },
        },
      }

      expect(() => analytics.track(nullUndefinedEvent)).not.toThrow()

      // Verify providers handled null/undefined appropriately
      expect(mockGtag).toHaveBeenCalled()
      expect(mockMixpanel.track).toHaveBeenCalled()
    })
  })

  describe('Memory Usage and Cleanup', () => {
    it('should not leak memory with high event volume', async () => {
      const analytics = AnalyticsBuilder.create()
        .addProvider(new GoogleAnalyticsProvider({ gtag: mockGtag }))
        .addProvider(new MixpanelProvider())
        .withConsent({ analytics: true })
        .build()

      await analytics.init()

      // Track initial memory usage if available
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Generate many events
      for (let batch = 0; batch < 10; batch++) {
        for (let i = 0; i < 100; i++) {
          analytics.track({
            name: 'high_frequency_event',
            payload: {
              event_id: `batch-${batch}-event-${i}`,
              timestamp: Date.now(),
              counter: i,
              data: 'x'.repeat(1000), // 1KB per event
            },
          })
        }

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0

      // Memory growth should be reasonable (less than 50MB for 10K events)
      if (initialMemory && finalMemory) {
        const memoryGrowth = finalMemory - initialMemory
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // 50MB
      }

      // Clean shutdown should free resources
      await analytics.shutdown()
    })

    it('should clean up properly after provider errors', async () => {
      let errorCount = 0
      const errorTrackingGtag = jest.fn(() => {
        errorCount++
        if (errorCount <= 100) {
          throw new Error('Simulated error')
        }
      })

      const analytics = AnalyticsBuilder.create()
        .addProvider(new GoogleAnalyticsProvider({ gtag: errorTrackingGtag }))
        .withConsent({ analytics: true })
        .build()

      await analytics.init()

      // Generate events that will cause errors
      for (let i = 0; i < 150; i++) {
        analytics.track({
          name: 'high_frequency_event',
          payload: {
            event_id: `error-test-${i}`,
            timestamp: Date.now(),
            counter: i,
          },
        })
      }

      // Should continue working after errors
      expect(errorTrackingGtag).toHaveBeenCalledTimes(150)

      // Clean shutdown
      await analytics.shutdown()
    })
  })

  describe('Provider Performance Characteristics', () => {
    it('should measure provider initialization times', async () => {
      const performanceProvider = new PerformanceTrackingProvider()

      const analytics = AnalyticsBuilder.create()
        .addProvider(performanceProvider)
        .addProvider(new GoogleAnalyticsProvider({ gtag: mockGtag }))
        .addProvider(new MixpanelProvider())
        .withConsent({ analytics: true })
        .build()

      const startTime = performance.now()
      await analytics.init()
      const totalInitTime = performance.now() - startTime

      // Init should be fast
      expect(totalInitTime).toBeLessThan(100)
      expect(performanceProvider.initTime).toBeGreaterThan(0)
      expect(performanceProvider.initTime).toBeLessThan(50)
    })

    it('should measure provider lifecycle operation times', async () => {
      const performanceProvider = new PerformanceTrackingProvider()

      const analytics = AnalyticsBuilder.create()
        .addProvider(performanceProvider)
        .withConsent({ analytics: true })
        .build()

      await analytics.init()

      // Test tracking performance
      const trackStartTime = performance.now()
      for (let i = 0; i < 100; i++) {
        analytics.track({
          name: 'high_frequency_event',
          payload: {
            event_id: `perf-${i}`,
            timestamp: Date.now(),
            counter: i,
          },
        })
      }
      const trackTotalTime = performance.now() - trackStartTime

      expect(trackTotalTime).toBeLessThan(100) // 100 events under 100ms
      expect(performanceProvider.trackTimes).toHaveLength(100)

      // Test identify performance
      const identifyStartTime = performance.now()
      for (let i = 0; i < 10; i++) {
        analytics.identify(`user-${i}`, { test_property: i })
      }
      const identifyTotalTime = performance.now() - identifyStartTime

      expect(identifyTotalTime).toBeLessThan(50)
      expect(performanceProvider.identifyTimes).toHaveLength(10)

      // Test flush performance
      await analytics.flush()
      expect(performanceProvider.flushTime).toBeLessThan(50)

      // Test shutdown performance
      await analytics.shutdown()
      expect(performanceProvider.shutdownTime).toBeLessThan(50)
    })
  })

  describe('Middleware Performance Impact', () => {
    it('should measure middleware processing overhead', async () => {
      const expensiveMiddleware: MiddlewareFunction = (event) => {
        // Simulate expensive operation
        for (let i = 0; i < 1000; i++) {
          JSON.stringify(event)
        }
        return event
      }

      const performanceProvider = new PerformanceTrackingProvider()

      // Test without middleware
      const analyticsWithoutMiddleware = AnalyticsBuilder.create()
        .addProvider(performanceProvider)
        .withConsent({ analytics: true })
        .build()

      await analyticsWithoutMiddleware.init()

      const startWithoutMiddleware = performance.now()
      for (let i = 0; i < 100; i++) {
        analyticsWithoutMiddleware.track({
          name: 'high_frequency_event',
          payload: { event_id: `no-mw-${i}`, timestamp: Date.now(), counter: i },
        })
      }
      const timeWithoutMiddleware = performance.now() - startWithoutMiddleware

      performanceProvider.trackTimes = [] // Reset

      // Test with expensive middleware
      const analyticsWithMiddleware = AnalyticsBuilder.create()
        .addProvider(performanceProvider)
        .addMiddleware(expensiveMiddleware)
        .withConsent({ analytics: true })
        .build()

      await analyticsWithMiddleware.init()

      const startWithMiddleware = performance.now()
      for (let i = 0; i < 100; i++) {
        analyticsWithMiddleware.track({
          name: 'high_frequency_event',
          payload: { event_id: `with-mw-${i}`, timestamp: Date.now(), counter: i },
        })
      }
      const timeWithMiddleware = performance.now() - startWithMiddleware

      // Middleware should add overhead, but not excessively
      expect(timeWithMiddleware).toBeGreaterThan(timeWithoutMiddleware)
      expect(timeWithMiddleware).toBeLessThan(timeWithoutMiddleware * 10) // Not more than 10x slower
    })
  })
})
