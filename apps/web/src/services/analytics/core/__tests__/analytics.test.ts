/**
 * Unit tests for Analytics orchestrator
 */

import { Analytics } from '../analytics'
import type { BaseProvider, MiddlewareFunction, SafeEventMap, AnalyticsEvent } from '../types'

// Mock providers
class MockProvider implements BaseProvider {
  readonly id = 'mock'
  private enabled = true
  public trackCalls: AnalyticsEvent[] = []

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  track(event: AnalyticsEvent): void {
    this.trackCalls.push(event)
  }

  async flush(): Promise<void> {
    return Promise.resolve()
  }

  shutdown(): Promise<void> {
    this.enabled = false
    return Promise.resolve()
  }
}

class MockIdentifyProvider extends MockProvider {
  public identifyCalls: Array<{ userId: string; traits?: Record<string, unknown> }> = []

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.identifyCalls.push({ userId, traits })
  }
}

class MockPageProvider extends MockProvider {
  public pageCalls: any[] = []

  page(context?: any): void {
    this.pageCalls.push(context)
  }
}

// Test event map
type TestEvents = SafeEventMap & {
  'Test Event': { testProperty: string; value: number }
  'Another Event': { data: string }
}

describe('Analytics', () => {
  let analytics: Analytics<TestEvents>
  let mockProvider1: MockProvider
  let mockProvider2: MockIdentifyProvider
  let mockProvider3: MockPageProvider

  beforeEach(() => {
    mockProvider1 = new MockProvider()
    mockProvider2 = new MockIdentifyProvider()
    mockProvider3 = new MockPageProvider()

    analytics = new Analytics<TestEvents>({
      providers: [mockProvider1, mockProvider2, mockProvider3],
      defaultContext: {
        userId: 'test-user',
        source: 'web',
      },
      consent: { analytics: true },
    })
  })

  describe('Initialization', () => {
    it('should create Analytics instance with providers', () => {
      expect(analytics.providers).toHaveLength(3)
      expect(analytics.providers[0].id).toBe('mock')
      expect(analytics.providers[1].id).toBe('mock')
      expect(analytics.providers[2].id).toBe('mock')
    })

    it('should create Analytics instance without providers', () => {
      const emptyAnalytics = new Analytics<TestEvents>({})
      expect(emptyAnalytics.providers).toHaveLength(0)
    })

    it('should initialize all providers', async () => {
      const initSpy1 = jest.spyOn(mockProvider1, 'track')
      const initSpy2 = jest.spyOn(mockProvider2, 'track')
      const initSpy3 = jest.spyOn(mockProvider3, 'track')

      await analytics.init()

      // Providers should be ready to track
      expect(initSpy1).not.toHaveBeenCalled()
      expect(initSpy2).not.toHaveBeenCalled()
      expect(initSpy3).not.toHaveBeenCalled()
    })

    it('should handle provider initialization errors gracefully', async () => {
      const errorProvider = {
        ...mockProvider1,
        init: jest.fn().mockRejectedValue(new Error('Init failed')),
      } as any

      const analytics = new Analytics({
        providers: [errorProvider, mockProvider2],
      })

      // Should not throw
      await expect(analytics.init()).resolves.not.toThrow()
    })
  })

  describe('Event Tracking', () => {
    beforeEach(async () => {
      await analytics.init()
    })

    it('should track events to all providers', () => {
      const event: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
      }

      analytics.track(event)

      expect(mockProvider1.trackCalls).toHaveLength(1)
      expect(mockProvider1.trackCalls[0]).toEqual(expect.objectContaining(event))

      expect(mockProvider2.trackCalls).toHaveLength(1)
      expect(mockProvider2.trackCalls[0]).toEqual(expect.objectContaining(event))

      expect(mockProvider3.trackCalls).toHaveLength(1)
      expect(mockProvider3.trackCalls[0]).toEqual(expect.objectContaining(event))
    })

    it('should add default context to events', () => {
      const event: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
      }

      analytics.track(event)

      const trackedEvent = mockProvider1.trackCalls[0]
      expect(trackedEvent.context).toMatchObject({
        userId: 'test-user',
        source: 'web',
      })
      expect(trackedEvent.timestamp).toBeDefined()
    })

    it('should merge event context with default context', () => {
      const event: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
        context: { chainId: '1', sessionId: 'session-123' },
      }

      analytics.track(event)

      const trackedEvent = mockProvider1.trackCalls[0]
      expect(trackedEvent.context).toMatchObject({
        userId: 'test-user',
        source: 'web',
        chainId: '1',
        sessionId: 'session-123',
      })
    })

    it('should not track to disabled providers', () => {
      mockProvider2.setEnabled(false)

      const event: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
      }

      analytics.track(event)

      expect(mockProvider1.trackCalls).toHaveLength(1)
      expect(mockProvider2.trackCalls).toHaveLength(0) // Disabled
      expect(mockProvider3.trackCalls).toHaveLength(1)
    })

    it('should handle provider tracking errors gracefully', () => {
      const errorProvider = {
        ...mockProvider1,
        track: jest.fn().mockImplementation(() => {
          throw new Error('Tracking failed')
        }),
      } as any

      const analytics = new Analytics({
        providers: [errorProvider, mockProvider2],
        defaultContext: { userId: 'test-user' },
      })

      const event: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
      }

      // Should not throw, other providers should still work
      expect(() => analytics.track(event)).not.toThrow()
      expect(mockProvider2.trackCalls).toHaveLength(1)
    })
  })

  describe('User Identification', () => {
    beforeEach(async () => {
      await analytics.init()
    })

    it('should identify users on identify-capable providers', () => {
      analytics.identify('user-123', { plan: 'premium' })

      // Only mockProvider2 supports identify
      expect(mockProvider2.identifyCalls).toHaveLength(1)
      expect(mockProvider2.identifyCalls[0]).toEqual({
        userId: 'user-123',
        traits: { plan: 'premium' },
      })
    })

    it('should identify users without traits', () => {
      analytics.identify('user-456')

      expect(mockProvider2.identifyCalls).toHaveLength(1)
      expect(mockProvider2.identifyCalls[0]).toEqual({
        userId: 'user-456',
        traits: undefined,
      })
    })

    it('should not identify on providers without identify capability', () => {
      analytics.identify('user-789')

      // mockProvider1 and mockProvider3 don't have identify method
      expect(mockProvider2.identifyCalls).toHaveLength(1)
    })

    it('should handle identify errors gracefully', () => {
      const errorProvider = {
        ...mockProvider2,
        identify: jest.fn().mockImplementation(() => {
          throw new Error('Identify failed')
        }),
      } as any

      const analytics = new Analytics({
        providers: [errorProvider],
      })

      // Should not throw
      expect(() => analytics.identify('user-123')).not.toThrow()
    })
  })

  describe('Page Tracking', () => {
    beforeEach(async () => {
      await analytics.init()
    })

    it('should track pages on page-capable providers', () => {
      const pageContext = { path: '/dashboard', title: 'Dashboard' }

      analytics.page(pageContext)

      // Only mockProvider3 supports page tracking
      expect(mockProvider3.pageCalls).toHaveLength(1)
      expect(mockProvider3.pageCalls[0]).toEqual(pageContext)
    })

    it('should track pages without context', () => {
      analytics.page()

      expect(mockProvider3.pageCalls).toHaveLength(1)
      expect(mockProvider3.pageCalls[0]).toBeUndefined()
    })

    it('should not track pages on providers without page capability', () => {
      analytics.page({ path: '/test' })

      // mockProvider1 and mockProvider2 don't have page method
      expect(mockProvider3.pageCalls).toHaveLength(1)
    })

    it('should handle page tracking errors gracefully', () => {
      const errorProvider = {
        ...mockProvider3,
        page: jest.fn().mockImplementation(() => {
          throw new Error('Page tracking failed')
        }),
      } as any

      const analytics = new Analytics({
        providers: [errorProvider],
      })

      // Should not throw
      expect(() => analytics.page({ path: '/test' })).not.toThrow()
    })
  })

  describe('Middleware', () => {
    it('should apply middleware to events', async () => {
      const middleware: MiddlewareFunction = (event, context) => ({
        ...event,
        payload: { ...event.payload, middlewareApplied: true },
        context: { ...context, middlewareContext: 'added' },
      })

      const analytics = new Analytics<TestEvents>({
        providers: [mockProvider1],
        middleware: [middleware],
        defaultContext: { userId: 'test' },
      })

      await analytics.init()

      const event: AnalyticsEvent<'Test Event', TestEvents['Test Event'] & { middlewareApplied: boolean }> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123, middlewareApplied: false },
      }

      analytics.track(event)

      const trackedEvent = mockProvider1.trackCalls[0]
      expect(trackedEvent.payload).toMatchObject({
        testProperty: 'test',
        value: 123,
        middlewareApplied: true,
      })
      expect(trackedEvent.context).toMatchObject({
        middlewareContext: 'added',
      })
    })

    it('should apply multiple middleware in order', async () => {
      const middleware1: MiddlewareFunction = (event) => ({
        ...event,
        payload: { ...event.payload, step1: true },
      })

      const middleware2: MiddlewareFunction = (event) => ({
        ...event,
        payload: { ...event.payload, step2: true },
      })

      const analytics = new Analytics<TestEvents>({
        providers: [mockProvider1],
        middleware: [middleware1, middleware2],
      })

      await analytics.init()

      const event: AnalyticsEvent<'Test Event', TestEvents['Test Event'] & { step1: boolean; step2: boolean }> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123, step1: false, step2: false },
      }

      analytics.track(event)

      const trackedEvent = mockProvider1.trackCalls[0]
      expect(trackedEvent.payload).toMatchObject({
        step1: true,
        step2: true,
      })
    })

    it('should handle middleware errors gracefully', async () => {
      const errorMiddleware: MiddlewareFunction = () => {
        throw new Error('Middleware failed')
      }

      const analytics = new Analytics<TestEvents>({
        providers: [mockProvider1],
        middleware: [errorMiddleware],
      })

      await analytics.init()

      const event: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
      }

      // Should not throw and should still track to provider
      expect(() => analytics.track(event)).not.toThrow()
      expect(mockProvider1.trackCalls).toHaveLength(1)
    })
  })

  describe('Consent Management', () => {
    it('should respect consent settings', async () => {
      const analytics = new Analytics<TestEvents>({
        providers: [mockProvider1],
        consent: { analytics: false }, // No consent
      })

      await analytics.init()

      const event: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
      }

      analytics.track(event)

      // Should not track without consent
      expect(mockProvider1.trackCalls).toHaveLength(0)
    })

    it('should track with consent', async () => {
      const analytics = new Analytics<TestEvents>({
        providers: [mockProvider1],
        consent: { analytics: true }, // Has consent
      })

      await analytics.init()

      const event: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
      }

      analytics.track(event)

      expect(mockProvider1.trackCalls).toHaveLength(1)
    })

    it('should default to no consent', async () => {
      const analytics = new Analytics<TestEvents>({
        providers: [mockProvider1],
        // No consent specified
      })

      await analytics.init()

      const event: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
      }

      analytics.track(event)

      // Should not track without explicit consent
      expect(mockProvider1.trackCalls).toHaveLength(0)
    })
  })

  describe('Lifecycle Management', () => {
    it('should flush all providers', async () => {
      const flushSpy1 = jest.spyOn(mockProvider1, 'flush')
      const flushSpy2 = jest.spyOn(mockProvider2, 'flush')
      const flushSpy3 = jest.spyOn(mockProvider3, 'flush')

      await analytics.flush()

      expect(flushSpy1).toHaveBeenCalled()
      expect(flushSpy2).toHaveBeenCalled()
      expect(flushSpy3).toHaveBeenCalled()
    })

    it('should handle flush errors gracefully', async () => {
      const errorProvider = {
        ...mockProvider1,
        flush: jest.fn().mockRejectedValue(new Error('Flush failed')),
      } as any

      const analytics = new Analytics({
        providers: [errorProvider, mockProvider2],
      })

      // Should not throw
      await expect(analytics.flush()).resolves.not.toThrow()
    })

    it('should shutdown all providers', async () => {
      const shutdownSpy1 = jest.spyOn(mockProvider1, 'shutdown')
      const shutdownSpy2 = jest.spyOn(mockProvider2, 'shutdown')
      const shutdownSpy3 = jest.spyOn(mockProvider3, 'shutdown')

      await analytics.shutdown()

      expect(shutdownSpy1).toHaveBeenCalled()
      expect(shutdownSpy2).toHaveBeenCalled()
      expect(shutdownSpy3).toHaveBeenCalled()
    })

    it('should handle shutdown errors gracefully', async () => {
      const errorProvider = {
        ...mockProvider1,
        shutdown: jest.fn().mockRejectedValue(new Error('Shutdown failed')),
      } as any

      const analytics = new Analytics({
        providers: [errorProvider, mockProvider2],
      })

      // Should not throw
      await expect(analytics.shutdown()).resolves.not.toThrow()
    })
  })
})