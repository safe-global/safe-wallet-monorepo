/**
 * Builder pattern implementation for ergonomic Analytics construction.
 * Follows Open/Closed principle - extend functionality without modifying core.
 */

import { Analytics } from './analytics'
import type { SafeEventMap, AnalyticsOptions, Router, EventContext } from './types'
import type { BaseProvider } from './provider'
import type { Middleware } from './middleware'
import type { ConsentState } from './types'

/**
 * Builder class for constructing Analytics instances
 */
export class AnalyticsBuilder<E extends SafeEventMap> {
  private instance: Analytics<E>

  constructor(options?: AnalyticsOptions<E>) {
    this.instance = new Analytics<E>(options)
  }

  /**
   * Add a provider to the analytics instance
   */
  withProvider(provider: BaseProvider<E>): this {
    this.instance.addProvider(provider)
    return this
  }

  /**
   * Add middleware to the processing pipeline
   */
  withMiddleware(middleware: Middleware<E>): this {
    this.instance.use(middleware)
    return this
  }

  /**
   * Set default context for all events
   */
  withDefaultContext(context: Partial<EventContext>): this {
    this.instance.setDefaultContext(context)
    return this
  }

  /**
   * Set initial consent preferences
   */
  withConsent(consent: ConsentState): this {
    this.instance.setConsent(consent)
    return this
  }

  /**
   * Set event router for provider selection
   */
  withRouter(router: Router<E>): this {
    this.instance.setRouter(router)
    return this
  }

  /**
   * Build and return the configured Analytics instance
   */
  build(): Analytics<E> {
    return this.instance
  }
}

/**
 * Convenience function for creating a new builder
 */
export function createAnalytics<E extends SafeEventMap>(options?: AnalyticsOptions<E>): AnalyticsBuilder<E> {
  return new AnalyticsBuilder<E>(options)
}
