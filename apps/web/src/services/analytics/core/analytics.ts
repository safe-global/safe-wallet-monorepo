/**
 * Core analytics orchestrator implementing Composite and Mediator patterns.
 * Manages multiple providers, middleware pipeline, and event routing.
 */

import type { SafeEventMap, AnalyticsEvent, EventContext, PageContext, AnalyticsOptions } from './types'
import type { EventUnion } from '../events/catalog'
import type { ProviderId, TrackOptions, Router } from '../providers/constants'
import type { BaseProvider } from './provider'
import { hasIdentifyCapability, hasGroupCapability, hasPageCapability } from './provider'
import { MiddlewareChain } from './middleware'
import { ConsentManager } from './consent'
import { shallowMerge } from './types'

type ProviderEntry<E extends SafeEventMap> = {
  provider: BaseProvider<E>
  enabled: boolean
}

/**
 * Main analytics orchestrator class
 */
export class Analytics<E extends Record<string, Record<string, unknown>> = Record<string, Record<string, unknown>>> {
  private providerMap = new Map<ProviderId, ProviderEntry<E>>()
  private middlewares = new MiddlewareChain<E>()
  private consent: ConsentManager
  private defaultContext: EventContext
  private onError?: (err: unknown, event?: EventUnion<E>) => void
  private router?: Router<E>
  private consentCache: { allowed: boolean; timestamp: number } | null = null

  constructor(
    options?: AnalyticsOptions<E> & {
      providers?: BaseProvider<E>[]
      middleware?: Array<(event: AnalyticsEvent<any, any>, context?: EventContext) => AnalyticsEvent<any, any> | null>
    },
  ) {
    this.defaultContext = options?.defaultContext || {}
    this.consent = new ConsentManager(options?.consent)
    this.onError = options?.onError
    this.router = options?.router

    // Register initial providers
    options?.providers?.forEach((p) => this.addProvider(p))

    // Register initial middleware
    options?.middleware?.forEach((m) => this.use(m))
  }

  /**
   * Add a provider to the analytics system
   */
  addProvider(provider: BaseProvider<E>): this {
    this.providerMap.set(provider.id as ProviderId, { provider, enabled: true })

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
  removeProvider(id: ProviderId): this {
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
  enableProvider(id: ProviderId): this {
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
  disableProvider(id: ProviderId): this {
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

    // Invalidate consent cache since consent state changed
    this.consentCache = null

    // Notify all providers of consent change
    const entries = Array.from(this.providerMap.values())
    for (const entry of entries) {
      entry.provider.init?.({
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
   * Get all currently enabled providers
   */
  private getEnabledProviders(): BaseProvider<E>[] {
    const enabledProviders: BaseProvider<E>[] = []
    const entries = Array.from(this.providerMap.values())
    for (const entry of entries) {
      if (entry.enabled && entry.provider.isEnabled()) {
        enabledProviders.push(entry.provider)
      }
    }
    return enabledProviders
  }

  /**
   * Check if analytics consent is granted with caching optimization
   */
  private hasConsentCached(): boolean {
    const consentState = this.consent.get()
    const currentTimestamp = consentState.updatedAt || 0

    // If cache is valid (consent hasn't changed), return cached result
    if (this.consentCache && this.consentCache.timestamp === currentTimestamp) {
      return this.consentCache.allowed
    }

    // Consent state changed, update cache
    const allowed = this.consent.allowsAnalytics()
    this.consentCache = { allowed, timestamp: currentTimestamp }

    return allowed
  }

  /**
   * Identify a user across providers
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    const enabledProviders = this.getEnabledProviders()

    for (const provider of enabledProviders) {
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
    const enabledProviders = this.getEnabledProviders()

    for (const provider of enabledProviders) {
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
    const enabledProviders = this.getEnabledProviders()

    for (const provider of enabledProviders) {
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
   * Track events through the middleware pipeline - new typed version
   */
  track(event: EventUnion<E>, options?: TrackOptions): void {
    const enriched: EventUnion<E> = {
      ...event,
      context: shallowMerge(this.defaultContext, event.context),
      timestamp: event.timestamp ?? Date.now(),
    }

    const dispatch = (processedEvent: EventUnion<E>) => {
      // Check consent before processing
      if (!this.hasConsentCached()) {
        // Drop event - no consent granted
        return
      }

      // Check online status
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
      if (!isOnline) {
        // Drop event - offline
        return
      }

      // Resolve provider routing
      const routerDecision = this.router?.(processedEvent) || {}
      const optionsDecision = options || {}

      const includeProviders = routerDecision.includeProviders || optionsDecision.includeProviders
      const excludeProviders = [...(routerDecision.excludeProviders || []), ...(optionsDecision.excludeProviders || [])]

      // Send to providers
      const enabledProviders = this.getEnabledProviders()

      for (const provider of enabledProviders) {
        // Apply routing rules
        if (includeProviders && includeProviders.length > 0) {
          if (!includeProviders.includes(provider.id as ProviderId)) continue
        }

        if (excludeProviders.includes(provider.id as ProviderId)) continue

        try {
          const result = provider.track(processedEvent as any)

          // Handle async providers
          if (result && typeof result.then === 'function') {
            result.catch((error) => {
              this.onError?.(error, processedEvent)
            })
          }
        } catch (error) {
          this.onError?.(error, processedEvent)
        }
      }
    }

    // Run through middleware pipeline
    const processed = this.middlewares.process(enriched as any, enriched.context)
    if (processed) dispatch(processed as EventUnion<E>)
  }

  /**
   * Flush all providers
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = []

    const entries = Array.from(this.providerMap.values())
    for (const entry of entries) {
      if (entry.provider.flush) {
        promises.push(Promise.resolve(entry.provider.flush()))
      }
    }

    await Promise.all(promises)
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
    const entries = Array.from(this.providerMap.values())
    for (const entry of entries) {
      if (entry.provider.shutdown) {
        promises.push(Promise.resolve(entry.provider.shutdown()))
      }
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
