/**
 * Core analytics orchestrator implementing Composite and Mediator patterns.
 * Manages multiple providers, middleware pipeline, and event routing.
 */

import type {
  SafeEventMap,
  AnalyticsEvent,
  EventContext,
  PageContext,
  AnalyticsOptions,
  TrackOptions,
  Router,
} from './types'
import type { BaseProvider } from './provider'
import { hasIdentifyCapability, hasGroupCapability, hasPageCapability } from './provider'
import { MiddlewareChain } from './middleware'
import { PersistentQueue } from './queue'
import { ConsentManager } from './consent'
import { shallowMerge } from './types'

type ProviderEntry<E extends SafeEventMap> = {
  provider: BaseProvider<E>
  enabled: boolean
}

/**
 * Main analytics orchestrator class
 */
export class Analytics<E extends SafeEventMap> {
  private providers = new Map<string, ProviderEntry<E>>()
  private middlewares = new MiddlewareChain<E>()
  private queue: PersistentQueue
  private consent: ConsentManager
  private defaultContext: EventContext
  private onError?: (err: unknown, event?: AnalyticsEvent) => void
  private router?: Router<E>

  constructor(options?: AnalyticsOptions<E>) {
    this.defaultContext = options?.defaultContext || {}
    this.consent = new ConsentManager(options?.consent)
    this.queue = new PersistentQueue(
      options?.queueKey || 'safe_analytics_queue',
      options?.queueMax || 1000,
      options?.queueTtlMs || 7 * 24 * 60 * 60 * 1000, // 7 days
    )
    this.onError = options?.onError
    this.router = options?.router

    // Auto-flush queue when coming back online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flushQueue())
    }
  }

  /**
   * Add a provider to the analytics system
   */
  addProvider(provider: BaseProvider<E>): this {
    this.providers.set(provider.id, { provider, enabled: true })

    // Initialize provider with current consent and context
    provider.init?.({
      consent: this.consent.get(),
      defaultContext: this.defaultContext,
    })

    return this
  }

  /**
   * Remove a provider from the system
   */
  removeProvider(id: string): this {
    const entry = this.providers.get(id)
    if (entry) {
      entry.provider.shutdown?.()
      this.providers.delete(id)
    }
    return this
  }

  /**
   * Enable a specific provider
   */
  enableProvider(id: string): this {
    const entry = this.providers.get(id)
    if (entry) {
      entry.enabled = true
      entry.provider.setEnabled(true)
    }
    return this
  }

  /**
   * Disable a specific provider
   */
  disableProvider(id: string): this {
    const entry = this.providers.get(id)
    if (entry) {
      entry.enabled = false
      entry.provider.setEnabled(false)
    }
    return this
  }

  /**
   * Add middleware to the processing chain
   */
  use(
    middleware: typeof this.middlewares extends MiddlewareChain<infer U>
      ? Parameters<MiddlewareChain<U>['use']>[0]
      : never,
  ): this {
    this.middlewares.use(middleware)
    return this
  }

  /**
   * Set the event router
   */
  setRouter(router: Router<E>): this {
    this.router = router
    return this
  }

  /**
   * Update consent preferences
   */
  setConsent(consentPatch: Parameters<ConsentManager['update']>[0]): this {
    this.consent.update(consentPatch)

    // Notify all providers of consent change
    for (const { provider } of this.providers.values()) {
      provider.init?.({
        consent: this.consent.get(),
        defaultContext: this.defaultContext,
      })
    }

    return this
  }

  /**
   * Update default context
   */
  setDefaultContext(contextPatch: Partial<EventContext>): this {
    this.defaultContext = shallowMerge(this.defaultContext, contextPatch)
    return this
  }

  /**
   * Identify a user across providers
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    for (const { provider, enabled } of this.providers.values()) {
      if (!enabled || !provider.isEnabled()) continue

      if (hasIdentifyCapability(provider)) {
        try {
          provider.identify(userId, traits)
        } catch (error) {
          this.onError?.(error)
        }
      }
    }
  }

  /**
   * Associate user with a group/organization
   */
  group(groupId: string, traits?: Record<string, unknown>): void {
    for (const { provider, enabled } of this.providers.values()) {
      if (!enabled || !provider.isEnabled()) continue

      if (hasGroupCapability(provider)) {
        try {
          provider.group(groupId, traits)
        } catch (error) {
          this.onError?.(error)
        }
      }
    }
  }

  /**
   * Track page views
   */
  page(context?: PageContext): void {
    for (const { provider, enabled } of this.providers.values()) {
      if (!enabled || !provider.isEnabled()) continue

      if (hasPageCapability(provider)) {
        try {
          provider.page(context)
        } catch (error) {
          this.onError?.(error)
        }
      }
    }
  }

  /**
   * Track events through the middleware pipeline
   */
  track<K extends keyof E & string>(
    name: K,
    payload: E[K],
    context?: Partial<EventContext>,
    options?: TrackOptions,
  ): void {
    const event: AnalyticsEvent<K, E[K]> = {
      name,
      payload,
      context: shallowMerge(this.defaultContext, context),
      timestamp: Date.now(),
    }

    const dispatch = (processedEvent: AnalyticsEvent<any, any>) => {
      // Check consent before processing
      if (!this.consent.allowsAnalytics()) {
        // Queue for later processing when consent is granted
        this.queue.enqueue(processedEvent)
        return
      }

      // Check online status
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
      if (!isOnline) {
        this.queue.enqueue(processedEvent)
        return
      }

      // Resolve provider routing
      const routerDecision = this.router?.(processedEvent) || {}
      const optionsDecision = options || {}

      const includeProviders = routerDecision.includeProviders || optionsDecision.includeProviders
      const excludeProviders = [...(routerDecision.excludeProviders || []), ...(optionsDecision.excludeProviders || [])]

      // Send to providers
      for (const { provider, enabled } of this.providers.values()) {
        if (!enabled || !provider.isEnabled()) continue

        // Apply routing rules
        if (includeProviders && includeProviders.length > 0) {
          if (!includeProviders.includes(provider.id)) continue
        }

        if (excludeProviders.includes(provider.id)) continue

        try {
          const result = provider.track(processedEvent as AnalyticsEvent<any, any>)

          // Handle async providers
          if (result && typeof result.then === 'function') {
            result.catch((error) => {
              this.queue.enqueue(processedEvent) // Retry later
              this.onError?.(error, processedEvent)
            })
          }
        } catch (error) {
          this.queue.enqueue(processedEvent) // Retry later
          this.onError?.(error, processedEvent)
        }
      }
    }

    // Run through middleware pipeline
    this.middlewares.run(event, dispatch)
  }

  /**
   * Flush all providers
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = []

    for (const { provider } of this.providers.values()) {
      if (provider.flush) {
        promises.push(Promise.resolve(provider.flush()))
      }
    }

    await Promise.all(promises)
  }

  /**
   * Process queued events
   */
  flushQueue(maxBatch: number = 200): void {
    if (!this.consent.allowsAnalytics()) {
      return // Still waiting for consent
    }

    let batch = this.queue.drain(maxBatch)

    while (batch.length > 0) {
      for (const event of batch) {
        // Process directly without middleware to avoid double-processing
        for (const { provider, enabled } of this.providers.values()) {
          if (!enabled || !provider.isEnabled()) continue

          try {
            provider.track(event as AnalyticsEvent<any, any>)
          } catch (error) {
            // Silently fail queued events to avoid infinite retry loops
            console.warn('[Analytics] Failed to process queued event:', error)
          }
        }
      }

      batch = this.queue.drain(maxBatch)
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.size()
  }

  /**
   * Clear the event queue
   */
  clearQueue(): void {
    this.queue.clear()
  }

  /**
   * Get list of active provider IDs
   */
  getProviders(): string[] {
    return Array.from(this.providers.keys())
  }
}
