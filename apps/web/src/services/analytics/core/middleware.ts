/**
 * Middleware system implementing Chain of Responsibility pattern.
 * Allows event transformation, filtering, and processing.
 */

import type { AnalyticsEvent, MiddlewareFunction, EventContext } from './types'
import type { EventUnion } from '../events/catalog'

export type Middleware<E extends Record<string, Record<string, unknown>>> = (
  event: EventUnion<E>,
  next: (event: EventUnion<E>) => void,
) => void

/**
 * Chain of Responsibility implementation for middleware processing
 */
export class MiddlewareChain<
  E extends Record<string, Record<string, unknown>> = Record<string, Record<string, unknown>>,
> {
  private chain: MiddlewareFunction[] = []
  private typedChain: Middleware<E>[] = []

  /**
   * Add middleware to the chain - new typed version
   */
  use(middleware: MiddlewareFunction): this {
    this.chain.push(middleware)
    return this
  }

  /**
   * Add typed middleware to the chain
   */
  useTyped(middleware: Middleware<E>): this {
    this.typedChain.push(middleware)
    return this
  }

  /**
   * Execute the middleware chain
   */
  run(event: AnalyticsEvent<any, any>, terminal: (e: AnalyticsEvent<any, any>) => void, context?: EventContext): void {
    const processed = this.process(event, context)
    if (processed) terminal(processed)
  }

  /**
   * Compatibility helpers for tests that expect size/isEmpty/process
   */
  size(): number {
    return this.chain.length
  }

  isEmpty(): boolean {
    return this.chain.length === 0
  }

  process(event: AnalyticsEvent<any, any>, context?: EventContext): AnalyticsEvent<any, any> | null {
    let current: AnalyticsEvent<any, any> | null = event
    let currentContext = context
    for (const middleware of this.chain) {
      if (current == null) return null
      try {
        current = middleware(current, currentContext)
        // Update context if middleware modified the event's context
        if (current && current.context !== undefined) {
          currentContext = current.context
        }
      } catch (error) {
        // Continue with next middleware if one fails
        continue
      }
    }
    return current
  }

  /**
   * Get current middleware count
   */
  get length(): number {
    return this.chain.length
  }

  /**
   * Clear all middleware
   */
  clear(): void {
    this.chain = []
  }
}

// Built-in middleware factories for tests (legacy)
export const createLoggingMiddleware = (options?: {
  enabled?: boolean
  prefix?: string
  includeContext?: boolean
}): MiddlewareFunction => {
  const { enabled = true, prefix = '[Analytics]', includeContext = false } = options || {}
  return (event, ctx) => {
    if (enabled) {
      if (includeContext) {
        console.log(prefix, 'Event:', event.name, 'Payload:', event.payload, 'Context:', ctx)
      } else {
        console.log(prefix, 'Event:', event.name, 'Payload:', event.payload)
      }
    }
    return event
  }
}

// New typed middleware factories using constants
export const createTypedLoggingMiddleware = <E extends Record<string, Record<string, unknown>>>(options?: {
  enabled?: boolean
  prefix?: string
  includeContext?: boolean
}): Middleware<E> => {
  const { enabled = true, prefix = '[Analytics]', includeContext = false } = options || {}
  return (event, next) => {
    if (enabled) {
      if (includeContext) {
        console.log(prefix, 'Event:', event.name, 'Payload:', event.payload, 'Context:', event.context)
      } else {
        console.log(prefix, 'Event:', event.name, 'Payload:', event.payload)
      }
    }
    next(event)
  }
}
