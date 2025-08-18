/**
 * Unit tests for AnalyticsBuilder
 */

import { AnalyticsBuilder } from '../builder'
import type { BaseProvider, MiddlewareFunction, SafeEventMap } from '../types'
import type { ProviderId } from '../../providers/constants'
import { PROVIDER } from '../../providers/constants'

// Mock provider
class MockProvider implements BaseProvider {
  readonly id: ProviderId
  private enabled = true

  constructor(id: ProviderId = PROVIDER.Mock) {
    this.id = id
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  track(): void {
    // Mock implementation
  }

  async flush(): Promise<void> {
    return Promise.resolve()
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}

describe('AnalyticsBuilder', () => {
  let builder: AnalyticsBuilder<SafeEventMap>

  beforeEach(() => {
    builder = AnalyticsBuilder.create<SafeEventMap>()
  })

  describe('Creation', () => {
    it('should create a new builder instance', () => {
      expect(builder).toBeInstanceOf(AnalyticsBuilder)
    })

    it('should create different instances', () => {
      const builder1 = AnalyticsBuilder.create()
      const builder2 = AnalyticsBuilder.create()
      expect(builder1).not.toBe(builder2)
    })
  })

  describe('Provider Management', () => {
    it('should add providers', () => {
      const provider1 = new MockProvider('mock1' as ProviderId)
      const provider2 = new MockProvider('mock2' as ProviderId)

      const result = builder.addProvider(provider1).addProvider(provider2)

      expect(result).toBe(builder) // Should return builder for chaining
    })

    it('should add multiple providers at once', () => {
      const providers = [new MockProvider('mock1' as ProviderId), new MockProvider('mock2' as ProviderId)]

      const result = builder.addProviders(providers)

      expect(result).toBe(builder) // Should return builder for chaining
    })

    it('should handle empty provider array', () => {
      const result = builder.addProviders([])
      expect(result).toBe(builder)
    })
  })

  describe('Middleware Management', () => {
    it('should add middleware', () => {
      const middleware: MiddlewareFunction = (event) => event

      const result = builder.addMiddleware(middleware)

      expect(result).toBe(builder) // Should return builder for chaining
    })

    it('should add multiple middleware functions', () => {
      const middleware1: MiddlewareFunction = (event) => event
      const middleware2: MiddlewareFunction = (event) => event

      const result = builder.addMiddleware(middleware1).addMiddleware(middleware2)

      expect(result).toBe(builder)
    })

    it('should add multiple middleware at once', () => {
      const middleware: MiddlewareFunction[] = [(event) => event, (event) => event]

      const result = builder.addMiddlewares(middleware)

      expect(result).toBe(builder)
    })

    it('should handle empty middleware array', () => {
      const result = builder.addMiddlewares([])
      expect(result).toBe(builder)
    })
  })

  describe('Configuration', () => {
    it('should set default context', () => {
      const context = { userId: 'test-user', source: 'web' as const }

      const result = builder.withDefaultContext(context)

      expect(result).toBe(builder)
    })

    it('should set consent', () => {
      const consent = { analytics: true }

      const result = builder.withConsent(consent)

      expect(result).toBe(builder)
    })

    it('should set debug mode', () => {
      const result = builder.withDebugMode(true)

      expect(result).toBe(builder)
    })

    it('should chain configuration methods', () => {
      const context = { userId: 'test-user' }
      const consent = { analytics: true }

      const result = builder.withDefaultContext(context).withConsent(consent).withDebugMode(true)

      expect(result).toBe(builder)
    })
  })

  describe('Building Analytics Instance', () => {
    it('should build analytics instance with minimal configuration', () => {
      const analytics = builder.build()

      expect(analytics).toBeDefined()
      expect(analytics.providers).toHaveLength(0)
    })

    it('should build analytics instance with providers', () => {
      const provider1 = new MockProvider('mock1' as ProviderId)
      const provider2 = new MockProvider('mock2' as ProviderId)

      const analytics = builder.addProvider(provider1).addProvider(provider2).build()

      expect(analytics.providers).toHaveLength(2)
      expect(analytics.providers[0]).toBe(provider1)
      expect(analytics.providers[1]).toBe(provider2)
    })

    it('should build analytics instance with middleware', () => {
      const middleware1: MiddlewareFunction = (event) => ({
        ...event,
        payload: { ...event.payload, middleware1: true },
      })
      const middleware2: MiddlewareFunction = (event) => ({
        ...event,
        payload: { ...event.payload, middleware2: true },
      })

      const provider = new MockProvider()
      const trackSpy = jest.spyOn(provider, 'track')

      const analytics = builder
        .addProvider(provider)
        .addMiddleware(middleware1)
        .addMiddleware(middleware2)
        .withConsent({ analytics: true })
        .build()

      // Test that middleware is applied
      analytics.track({
        name: 'test',
        payload: { original: true },
      })

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test',
          payload: expect.objectContaining({
            original: true,
            middleware1: true,
            middleware2: true,
          }),
        }),
      )
    })

    it('should build analytics instance with default context', () => {
      const provider = new MockProvider()
      const trackSpy = jest.spyOn(provider, 'track')

      const context = { userId: 'test-user', source: 'web' as const }

      const analytics = builder
        .addProvider(provider)
        .withDefaultContext(context)
        .withConsent({ analytics: true })
        .build()

      analytics.track({ name: 'test', payload: {} })

      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining(context),
        }),
      )
    })

    it('should build analytics instance with consent', () => {
      const provider = new MockProvider()
      const trackSpy = jest.spyOn(provider, 'track')

      const analytics = builder.addProvider(provider).withConsent({ analytics: false }).build()

      analytics.track({ name: 'test', payload: {} })

      // Should not track without consent
      expect(trackSpy).not.toHaveBeenCalled()
    })

    it('should build multiple independent instances', () => {
      const provider1 = new MockProvider('mock1' as ProviderId)
      const provider2 = new MockProvider('mock2' as ProviderId)

      const analytics1 = builder.addProvider(provider1).build()
      const analytics2 = AnalyticsBuilder.create().addProvider(provider2).build()

      expect(analytics1).not.toBe(analytics2)
      expect(analytics1.providers).toHaveLength(1)
      expect(analytics2.providers).toHaveLength(1)
      expect(analytics1.providers[0]).toBe(provider1)
      expect(analytics2.providers[0]).toBe(provider2)
    })
  })

  describe('Method Chaining', () => {
    it('should support fluent interface for all methods', () => {
      const provider = new MockProvider()
      const middleware: MiddlewareFunction = (event) => event
      const context = { userId: 'test' }
      const consent = { analytics: true }

      // This should not throw and should return a valid analytics instance
      const analytics = AnalyticsBuilder.create<SafeEventMap>()
        .addProvider(provider)
        .addProviders([])
        .addMiddleware(middleware)
        .addMiddlewares([])
        .withDefaultContext(context)
        .withConsent(consent)
        .withDebugMode(false)
        .build()

      expect(analytics).toBeDefined()
      expect(analytics.providers).toHaveLength(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle null/undefined providers gracefully', () => {
      // TypeScript would prevent this, but test runtime safety
      expect(() => {
        ;(builder as any).addProvider(null)
      }).not.toThrow()

      expect(() => {
        ;(builder as any).addProvider(undefined)
      }).not.toThrow()
    })

    it('should handle null/undefined middleware gracefully', () => {
      expect(() => {
        ;(builder as any).addMiddleware(null)
      }).not.toThrow()

      expect(() => {
        ;(builder as any).addMiddleware(undefined)
      }).not.toThrow()
    })

    it('should handle null/undefined context gracefully', () => {
      expect(() => {
        ;(builder as any).withDefaultContext(null)
      }).not.toThrow()

      const analytics = builder.build()
      expect(analytics).toBeDefined()
    })

    it('should handle null/undefined consent gracefully', () => {
      expect(() => {
        ;(builder as any).withConsent(null)
      }).not.toThrow()

      const analytics = builder.build()
      expect(analytics).toBeDefined()
    })
  })
})
