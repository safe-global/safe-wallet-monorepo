/**
 * Unit tests for Middleware system
 */

import {
  MiddlewareChain,
  createLoggingMiddleware,
} from '../middleware'
import type { MiddlewareFunction, AnalyticsEvent, EventContext, SafeEventMap } from '../types'

// Test event types
type TestEvents = SafeEventMap & {
  'Test Event': {
    testProperty: string
    value: number
    email?: string
    userId?: string
    sensitive?: string
  }
  'Another Event': { data: string }
}

describe('MiddlewareChain', () => {
  let middlewareChain: MiddlewareChain
  let mockEvent: AnalyticsEvent<'Test Event', TestEvents['Test Event']>
  let mockContext: EventContext

  beforeEach(() => {
    middlewareChain = new MiddlewareChain()
    mockEvent = {
      name: 'Test Event',
      payload: { testProperty: 'test', value: 123 },
      timestamp: Date.now(),
    }
    mockContext = {
      userId: 'user-123',
      source: 'web',
      sessionId: 'session-456',
    }
  })

  describe('Chain Management', () => {
    it('should create empty middleware chain', () => {
      expect(middlewareChain.size()).toBe(0)
      expect(middlewareChain.isEmpty()).toBe(true)
    })

    it('should add middleware to chain', () => {
      const middleware: MiddlewareFunction = (event) => event

      middlewareChain.use(middleware)

      expect(middlewareChain.size()).toBe(1)
      expect(middlewareChain.isEmpty()).toBe(false)
    })

    it('should add multiple middleware functions', () => {
      const middleware1: MiddlewareFunction = (event) => event
      const middleware2: MiddlewareFunction = (event) => event
      const middleware3: MiddlewareFunction = (event) => event

      middlewareChain.use(middleware1).use(middleware2).use(middleware3)

      expect(middlewareChain.size()).toBe(3)
    })

    it('should support method chaining', () => {
      const middleware1: MiddlewareFunction = (event) => event
      const middleware2: MiddlewareFunction = (event) => event

      const result = middlewareChain.use(middleware1).use(middleware2)

      expect(result).toBe(middlewareChain)
      expect(middlewareChain.size()).toBe(2)
    })

    it('should clear all middleware', () => {
      const middleware: MiddlewareFunction = (event) => event

      middlewareChain.use(middleware).use(middleware)
      expect(middlewareChain.size()).toBe(2)

      middlewareChain.clear()

      expect(middlewareChain.size()).toBe(0)
      expect(middlewareChain.isEmpty()).toBe(true)
    })
  })

  describe('Event Processing', () => {
    it('should pass through events when no middleware', () => {
      const result = middlewareChain.process(mockEvent, mockContext)

      expect(result).toEqual(mockEvent)
    })

    it('should apply single middleware', () => {
      const middleware: MiddlewareFunction = (event) => ({
        ...event,
        payload: { ...event.payload, processed: true },
      })

      middlewareChain.use(middleware)

      const result = middlewareChain.process(mockEvent, mockContext)

      expect(result?.payload).toMatchObject({
        testProperty: 'test',
        value: 123,
        processed: true,
      })
    })

    it('should apply multiple middleware in order', () => {
      const middleware1: MiddlewareFunction = (event) => ({
        ...event,
        payload: { ...event.payload, step1: true },
      })

      const middleware2: MiddlewareFunction = (event) => ({
        ...event,
        payload: { ...event.payload, step2: true },
      })

      const middleware3: MiddlewareFunction = (event) => ({
        ...event,
        payload: { ...event.payload, step3: true },
      })

      middlewareChain.use(middleware1).use(middleware2).use(middleware3)

      const result = middlewareChain.process(mockEvent, mockContext)

      expect(result?.payload).toMatchObject({
        testProperty: 'test',
        value: 123,
        step1: true,
        step2: true,
        step3: true,
      })
    })

    it('should pass context to middleware', () => {
      const contextCheckingMiddleware: MiddlewareFunction = (event, context) => ({
        ...event,
        payload: {
          ...event.payload,
          contextUserId: context?.userId,
          contextSource: context?.source,
        },
      })

      middlewareChain.use(contextCheckingMiddleware)

      const result = middlewareChain.process(mockEvent, mockContext)

      expect(result?.payload).toMatchObject({
        contextUserId: 'user-123',
        contextSource: 'web',
      })
    })

    it('should allow middleware to modify context', () => {
      const contextModifyingMiddleware: MiddlewareFunction = (event, context) => ({
        ...event,
        context: { ...context, modified: true },
      })

      const contextConsumingMiddleware: MiddlewareFunction = (event, context) => ({
        ...event,
        payload: {
          ...event.payload,
          wasContextModified: (context as any)?.modified === true,
        },
      })

      middlewareChain.use(contextModifyingMiddleware).use(contextConsumingMiddleware)

      const result = middlewareChain.process(mockEvent, mockContext)

      expect(result?.payload).toMatchObject({
        wasContextModified: true,
      })
    })

    it('should handle middleware returning completely different events', () => {
      const transformingMiddleware: MiddlewareFunction = () => ({
        name: 'Transformed Event',
        payload: { transformed: true },
        timestamp: Date.now(),
      })

      middlewareChain.use(transformingMiddleware)

      const result = middlewareChain.process(mockEvent, mockContext)

      expect(result?.name).toBe('Transformed Event')
      expect(result?.payload).toEqual({ transformed: true })
    })

    it('should handle middleware that filters out events', () => {
      const filteringMiddleware: MiddlewareFunction = (event) => {
        // Filter out events with specific properties
        if (event.payload && (event.payload as any).shouldFilter) {
          return null as any // or undefined
        }
        return event
      }

      middlewareChain.use(filteringMiddleware)

      // Test with regular event
      const normalResult = middlewareChain.process(mockEvent, mockContext)
      expect(normalResult).toBeDefined()

      // Test with filtered event
      const filteredEvent = {
        ...mockEvent,
        payload: { ...mockEvent.payload, shouldFilter: true },
      }
      const filteredResult = middlewareChain.process(filteredEvent, mockContext)
      expect(filteredResult).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle middleware throwing errors', () => {
      const errorMiddleware: MiddlewareFunction = () => {
        throw new Error('Middleware error')
      }

      const safeMiddleware: MiddlewareFunction = (event) => ({
        ...event,
        payload: { ...event.payload, afterError: true },
      })

      middlewareChain.use(errorMiddleware).use(safeMiddleware)

      // Should not throw and should continue with remaining middleware
      const result = middlewareChain.process(mockEvent, mockContext)

      expect(result).toBeDefined()
      // The safe middleware should still run
      expect(result?.payload).toMatchObject({ afterError: true })
    })

    it('should handle multiple failing middleware', () => {
      const errorMiddleware1: MiddlewareFunction = () => {
        throw new Error('Error 1')
      }

      const errorMiddleware2: MiddlewareFunction = () => {
        throw new Error('Error 2')
      }

      const safeMiddleware: MiddlewareFunction = (event) => ({
        ...event,
        payload: { ...event.payload, safe: true },
      })

      middlewareChain.use(errorMiddleware1).use(errorMiddleware2).use(safeMiddleware)

      const result = middlewareChain.process(mockEvent, mockContext)

      expect(result?.payload).toMatchObject({ safe: true })
    })

    it('should handle middleware returning invalid values', () => {
      const invalidMiddleware: MiddlewareFunction = () => {
        return undefined as any
      }

      const validMiddleware: MiddlewareFunction = (event) => ({
        ...event,
        payload: { ...event.payload, valid: true },
      })

      middlewareChain.use(invalidMiddleware).use(validMiddleware)

      const result = middlewareChain.process(mockEvent, mockContext)

      // Should handle gracefully and continue
      expect(result).toBeDefined()
    })
  })
})

describe('Built-in Middleware', () => {
  let mockEvent: AnalyticsEvent<'Test Event', TestEvents['Test Event']>
  let mockContext: EventContext

  beforeEach(() => {
    mockEvent = {
      name: 'Test Event',
      payload: {
        testProperty: 'test',
        value: 123,
        email: 'user@example.com',
        userId: 'user-123',
        sensitive: 'secret-data',
      },
      timestamp: Date.now(),
    }
    mockContext = {
      userId: 'user-123',
      source: 'web',
    }
  })

  describe('Logging Middleware', () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('should log events when created with default options', () => {
      const loggingMiddleware = createLoggingMiddleware()

      const result = loggingMiddleware(mockEvent, mockContext)

      expect(consoleSpy).toHaveBeenCalledWith('[Analytics]', 'Event:', mockEvent.name, 'Payload:', mockEvent.payload)
      expect(result).toEqual(mockEvent)
    })

    it('should log events with custom prefix', () => {
      const loggingMiddleware = createLoggingMiddleware({
        prefix: '[Custom Analytics]',
      })

      loggingMiddleware(mockEvent, mockContext)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Custom Analytics]',
        'Event:',
        mockEvent.name,
        'Payload:',
        mockEvent.payload,
      )
    })

    it('should not log when disabled', () => {
      const loggingMiddleware = createLoggingMiddleware({ enabled: false })

      const result = loggingMiddleware(mockEvent, mockContext)

      expect(consoleSpy).not.toHaveBeenCalled()
      expect(result).toEqual(mockEvent)
    })

    it('should include context in logs when specified', () => {
      const loggingMiddleware = createLoggingMiddleware({
        includeContext: true,
      })

      loggingMiddleware(mockEvent, mockContext)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'Event:',
        mockEvent.name,
        'Payload:',
        mockEvent.payload,
        'Context:',
        mockContext,
      )
    })
  })

})
