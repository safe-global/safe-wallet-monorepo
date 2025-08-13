/**
 * Middleware system implementing Chain of Responsibility pattern.
 * Allows event transformation, filtering, and processing.
 */

import type { AnalyticsEvent, MiddlewareFunction, EventContext } from './types'
import type { EventUnion, EventName } from '../events/catalog'

export type Middleware<E extends Record<string, Record<string, unknown>>> = (
  event: EventUnion<E>,
  next: (event: EventUnion<E>) => void,
) => void

/**
 * Chain of Responsibility implementation for middleware processing
 */
export class MiddlewareChain<E extends Record<string, Record<string, unknown>> = Record<string, Record<string, unknown>>> {
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
    for (const middleware of this.chain) {
      if (current == null) return null
      current = middleware(current, context)
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

export const createSamplingMiddleware = (options: {
  rate: number
  eventRates?: Record<string, number>
}): MiddlewareFunction => {
  const { rate, eventRates } = options
  return (event) => {
    const eventRate = eventRates && eventRates[event.name as string]
    const effectiveRate = typeof eventRate === 'number' ? eventRate : rate
    const pass = Math.random() < effectiveRate
    if (!pass) return null
    return { ...event, context: { ...(event.context || {}), sampled: true, sampleRate: effectiveRate } }
  }
}

export const createPiiScrubberMiddleware = (options?: {
  piiFields?: string[]
  replaceWith?: string
}): MiddlewareFunction => {
  const { piiFields = ['email'], replaceWith } = options || {}
  const scrub = (value: any): any => {
    if (Array.isArray(value)) return value.map(scrub)
    if (value && typeof value === 'object') {
      const result: any = {}
      for (const [k, v] of Object.entries(value)) {
        if (piiFields.includes(k)) {
          result[k] = replaceWith ?? undefined
        } else {
          result[k] = scrub(v)
        }
      }
      return result
    }
    return value
  }
  return (event) => {
    if (!event.payload) return event
    return { ...event, payload: scrub(event.payload) }
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

export const createTypedSamplingMiddleware = <E extends Record<string, Record<string, unknown>>>(options: {
  rate: number
  eventRates?: Partial<Record<EventName, number>>
}): Middleware<E> => {
  const { rate, eventRates } = options
  return (event, next) => {
    const eventRate = eventRates && eventRates[event.name as EventName]
    const effectiveRate = typeof eventRate === 'number' ? eventRate : rate
    const pass = Math.random() < effectiveRate
    if (!pass) return // Drop event

    const enrichedEvent = {
      ...event,
      context: {
        ...(event.context || {}),
        sampled: true,
        sampleRate: effectiveRate
      }
    }
    next(enrichedEvent)
  }
}

export const createTypedPiiScrubberMiddleware = <E extends Record<string, Record<string, unknown>>>(options?: {
  piiFields?: string[]
  replaceWith?: string
}): Middleware<E> => {
  const { piiFields = ['email'], replaceWith } = options || {}
  const scrub = (value: any): any => {
    if (Array.isArray(value)) return value.map(scrub)
    if (value && typeof value === 'object') {
      const result: any = {}
      for (const [k, v] of Object.entries(value)) {
        if (piiFields.includes(k)) {
          result[k] = replaceWith ?? undefined
        } else {
          result[k] = scrub(v)
        }
      }
      return result
    }
    return value
  }

  return (event, next) => {
    if (!event.payload) {
      next(event)
      return
    }

    const scrubbedEvent = {
      ...event,
      payload: scrub(event.payload)
    }
    next(scrubbedEvent)
  }
}
