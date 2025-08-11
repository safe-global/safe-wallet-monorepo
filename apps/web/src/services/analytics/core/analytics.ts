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
export class Analytics<E extends SafeEventMap = SafeEventMap> {
  private providerMap = new Map<string, ProviderEntry<E>>()
  private middlewares = new MiddlewareChain<E>()
  private queue: PersistentQueue
  private consent: ConsentManager
  private defaultContext: EventContext
  private onError?: (err: unknown, event?: AnalyticsEvent) => void
  private router?: Router<E>

  constructor(
    options?: AnalyticsOptions<E> & {
      providers?: BaseProvider<E>[]
      middleware?: Array<(event: AnalyticsEvent<any, any>, context?: EventContext) => AnalyticsEvent<any, any> | null>
    },
  ) {
    this.defaultContext = options?.defaultContext || {}
    this.consent = new ConsentManager(options?.consent)
    this.queue = new PersistentQueue(
      options?.queueKey || 'safe_analytics_queue',
      options?.queueMax || 1000,
      options?.queueTtlMs || 7 * 24 * 60 * 60 * 1000, // 7 days
    )
    this.onError = options?.onError
    this.router = options?.router

    // Register initial providers
    options?.providers?.forEach((p) => this.addProvider(p))

    // Register initial middleware
    options?.middleware?.forEach((m) => this.use(m))

    // Auto-flush queue when coming back online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flushQueue())
    }
  }

  /**
   * Add a provider to the analytics system
   */
  addProvider(provider: BaseProvider<E>): this {
    this.providerMap.set(provider.id, { provider, enabled: true })

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
    const entry = this.providerMap.get(id)
    if (entry) {
      entry.provider.shutdown?.()
      this.providerMap.delete(id)
    }
    return this
  }

  /**
   * Enable a specific provider
   */
  enableProvider(id: string): this {
    const entry = this.providerMap.get(id)
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
    const entry = this.providerMap.get(id)
    if (entry) {
      entry.enabled = false
      entry.provider.setEnabled(false)
    }
    return this
  }

  /**
   * Add middleware to the processing chain
   */
  use(middleware: (event: AnalyticsEvent<any, any>, context?: EventContext) => AnalyticsEvent<any, any> | null): this {
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
    for (const { provider } of this.providerMap.values()) {
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
    for (const { provider, enabled } of this.providerMap.values()) {
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
    for (const { provider, enabled } of this.providerMap.values()) {
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
    for (const { provider, enabled } of this.providerMap.values()) {
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
  track(event: AnalyticsEvent<any, any>, options?: TrackOptions): void {
    const enriched: AnalyticsEvent<any, any> = {
      ...event,
      context: shallowMerge(this.defaultContext, event.context),
      timestamp: event.timestamp ?? Date.now(),
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
      const routerDecision = this.router?.(processedEvent as any) || {}
      const optionsDecision = options || {}

      const includeProviders = routerDecision.includeProviders || optionsDecision.includeProviders
      const excludeProviders = [...(routerDecision.excludeProviders || []), ...(optionsDecision.excludeProviders || [])]

      // Send to providers
      for (const { provider, enabled } of this.providerMap.values()) {
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
    const processed = this.middlewares.process(enriched, enriched.context)
    if (processed) dispatch(processed)
  }

  /**
   * Flush all providers
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = []

    for (const { provider } of this.providerMap.values()) {
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
        for (const { provider, enabled } of this.providerMap.values()) {
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
    return Array.from(this.providerMap.keys())
  }

  /**
   * Initialize providers. Present for API compatibility in tests.
   */
  async init(): Promise<void> {
    // Nothing to do eagerly; providers receive init on addProvider and consent changes
  }

  /**
   * Shutdown all providers gracefully
   */
  async shutdown(): Promise<void> {
    const promises: Promise<void>[] = []
    for (const { provider } of this.providerMap.values()) {
      if (provider.shutdown) promises.push(Promise.resolve(provider.shutdown()))
    }
    await Promise.all(promises)
  }

  /**
   * Public providers list for tests and consumers
   */
  get providers(): BaseProvider<E>[] {
    return Array.from(this.providerMap.values()).map((e) => e.provider)
  }
}
