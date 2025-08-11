/**
 * Middleware system implementing Chain of Responsibility pattern.
 * Allows event transformation, filtering, and processing.
 */

import type { AnalyticsEvent, SafeEventMap } from './types'

export type Middleware<E extends SafeEventMap> = (
  event: AnalyticsEvent<keyof E & string, E[keyof E & string]>,
  next: (event: AnalyticsEvent<any, any>) => void,
) => void

/**
 * Chain of Responsibility implementation for middleware processing
 */
export class MiddlewareChain<E extends SafeEventMap> {
  private chain: Middleware<E>[] = []

  /**
   * Add middleware to the chain
   */
  use(middleware: Middleware<E>): this {
    this.chain.push(middleware)
    return this
  }

  /**
   * Execute the middleware chain
   */
  run(event: AnalyticsEvent<any, any>, terminal: (e: AnalyticsEvent<any, any>) => void): void {
    let index = -1

    const dispatch = (i: number, e: AnalyticsEvent<any, any>) => {
      if (i <= index) {
        throw new Error('next() called multiple times in middleware')
      }

      index = i
      const middleware = this.chain[i]

      if (!middleware) {
        // No more middleware, call terminal function
        return terminal(e)
      }

      // Execute current middleware
      middleware(e, (nextEvent) => dispatch(i + 1, nextEvent))
    }

    dispatch(0, event)
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
