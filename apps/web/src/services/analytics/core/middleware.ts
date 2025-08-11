/**
 * Middleware system implementing Chain of Responsibility pattern.
 * Allows event transformation, filtering, and processing.
 */

import type { AnalyticsEvent, SafeEventMap, MiddlewareFunction, EventContext } from './types'

export type Middleware<E extends SafeEventMap> = (
  event: AnalyticsEvent<keyof E & string, E[keyof E & string]>,
  next: (event: AnalyticsEvent<any, any>) => void,
) => void

/**
 * Chain of Responsibility implementation for middleware processing
 */
export class MiddlewareChain<_E extends SafeEventMap = SafeEventMap> {
  private chain: MiddlewareFunction[] = []

  /**
   * Add middleware to the chain
   */
  use(middleware: MiddlewareFunction): this {
    this.chain.push(middleware)
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

// Built-in middleware factories for tests
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
