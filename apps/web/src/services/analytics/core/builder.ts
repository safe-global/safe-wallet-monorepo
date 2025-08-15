/**
 * Builder pattern implementation for ergonomic Analytics construction.
 * Follows Open/Closed principle - extend functionality without modifying core.
 */

import { Analytics } from './analytics'
import type { SafeEventMap, AnalyticsOptions, Router, EventContext, MiddlewareFunction } from './types'
import type { BaseProvider } from './provider'
import type { ConsentState } from './types'

/**
 * Builder class for constructing Analytics instances
 */
export class AnalyticsBuilder<E extends SafeEventMap = SafeEventMap> {
  private providers: BaseProvider<E>[] = []
  private middlewares: MiddlewareFunction[] = []
  private defaultContext?: Partial<EventContext>
  private consent?: ConsentState
  private router?: Router<E>
  private debugMode: boolean = false

  static create<T extends SafeEventMap = SafeEventMap>(options?: AnalyticsOptions<T>): AnalyticsBuilder<T> {
    const builder = new AnalyticsBuilder<T>()
    if (options?.defaultContext) builder.defaultContext = options.defaultContext
    if (options?.consent) builder.consent = options.consent
    if (options?.router) builder.router = options.router
    return builder
  }

  addProvider(provider: BaseProvider<E>): this {
    if (provider) this.providers.push(provider)
    return this
  }

  addProviders(providers: BaseProvider<E>[]): this {
    providers?.forEach((p) => this.addProvider(p))
    return this
  }

  addMiddleware(middleware: MiddlewareFunction): this {
    if (middleware) this.middlewares.push(middleware)
    return this
  }

  addMiddlewares(middlewares: MiddlewareFunction[]): this {
    middlewares?.forEach((m) => this.addMiddleware(m))
    return this
  }

  withDefaultContext(context: Partial<EventContext> | null): this {
    if (context) this.defaultContext = context
    return this
  }

  withConsent(consent: ConsentState | null): this {
    if (consent) this.consent = consent
    return this
  }

  withRouter(router: Router<E>): this {
    this.router = router
    return this
  }

  withDebugMode(enabled: boolean): this {
    this.debugMode = Boolean(enabled)
    return this
  }

  build(): Analytics<E> {
    const analytics = new Analytics<E>({
      defaultContext: this.defaultContext,
      consent: this.consent,
      router: this.router,
      providers: this.providers,
      middleware: this.middlewares,
    })
    // debugMode could be wired to a logging middleware later
    return analytics
  }
}

/**
 * Convenience function for creating a new builder
 */
export function createAnalytics<E extends SafeEventMap>(options?: AnalyticsOptions<E>): AnalyticsBuilder<E> {
  return AnalyticsBuilder.create<E>(options)
}
