/**
 * Core analytics orchestrator implementing Composite and Mediator patterns.
 * Manages multiple providers, middleware pipeline, and event routing.
 */

import type { SafeEventMap, AnalyticsEvent, EventContext, PageContext, AnalyticsOptions } from './types'
import type { EventUnion } from '../events/catalog'
import type { ProviderId, TrackOptions, Router } from '../providers/constants'
import type { BaseProvider } from './provider'
import { hasIdentifyCapability, hasGroupCapability, hasPageCapability } from './provider'
import type { IdentifyCapable, GroupCapable, PageCapable } from './provider'
import { MiddlewareChain } from './middleware'
import { ConsentManager } from './consent'
import type { ConsentState } from './types'
import { shallowMerge } from './types'

type ProviderEntry<E extends SafeEventMap> = {
  provider: BaseProvider<E>
  enabled: boolean
}

/**
 * Main analytics orchestrator class
 */
export class Analytics<E extends SafeEventMap = SafeEventMap> {
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

    // Listen for consent changes to invalidate cache and notify providers
    this.consent.addListener((newConsentState) => {
      // Invalidate consent cache since consent state changed
      this.consentCache = null

      // Notify all providers of consent change
      this.notifyProvidersOfConsentChange(newConsentState)
    })

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
    try {
      const initResult = provider.init?.({
        consent: this.consent.get(),
        defaultContext: this.defaultContext,
      })

      // Handle async initialization errors
      if (this.isThenable(initResult)) {
        initResult.catch((error: unknown) => {
          this.onError?.(error)
        })
      }
    } catch (error) {
      this.onError?.(error)
    }

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
   * Check if event should be processed based on consent and online status
   */
  private shouldProcessEvent(): boolean {
    // Check consent before processing
    if (!this.hasConsentCached()) {
      return false
    }

    // Check online status
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine !== false : true
    if (!isOnline) {
      return false
    }

    return true
  }

  /**
   * Resolve provider routing decisions
   */
  private resolveProviderRouting(event: EventUnion<E>, options?: TrackOptions) {
    const routerDecision = this.router?.(event) || {}
    const optionsDecision = options || {}

    const includeProviders = routerDecision.includeProviders || optionsDecision.includeProviders
    const excludeProviders = [...(routerDecision.excludeProviders || []), ...(optionsDecision.excludeProviders || [])]

    return { includeProviders, excludeProviders }
  }

  /**
   * Filter providers based on routing rules
   */
  private filterProviders(
    includeProviders?: readonly ProviderId[],
    excludeProviders: readonly ProviderId[] = [],
  ): BaseProvider<E>[] {
    const enabledProviders = this.getEnabledProviders()

    return enabledProviders.filter((provider) => {
      // Apply include filter
      if (includeProviders && includeProviders.length > 0) {
        if (!includeProviders.includes(provider.id as ProviderId)) return false
      }

      // Apply exclude filter
      if (excludeProviders.includes(provider.id as ProviderId)) return false

      return true
    })
  }

  /**
   * Check if a value is a thenable (Promise-like object)
   */
  private isThenable(value: unknown): value is Promise<unknown> {
    return (
      value !== null &&
      typeof value === 'object' &&
      'then' in value &&
      typeof (value as { then: unknown }).then === 'function'
    )
  }

  /**
   * Handle execution result with async promise error handling
   */
  private handleExecutionResult(result: unknown, errorContext?: unknown): void {
    if (this.isThenable(result)) {
      result.catch((error: unknown) => {
        this.onError?.(error, errorContext as EventUnion<E>)
      })
    }
  }

  /**
   * Execute an operation on providers that have a specific capability
   */
  private executeOnCapableProviders(
    capabilityCheck: (provider: BaseProvider<E>) => boolean,
    operation: (provider: unknown) => void | Promise<void>,
  ): void {
    const enabledProviders = this.getEnabledProviders()

    for (const provider of enabledProviders) {
      if (capabilityCheck(provider)) {
        try {
          const result = operation(provider)
          this.handleExecutionResult(result)
        } catch (error) {
          this.onError?.(error)
        }
      }
    }
  }

  /**
   * Execute event tracking on filtered providers
   */
  private executeOnProviders(
    event: EventUnion<E>,
    includeProviders?: readonly ProviderId[],
    excludeProviders: readonly ProviderId[] = [],
  ): void {
    const filteredProviders = this.filterProviders(includeProviders, excludeProviders)

    for (const provider of filteredProviders) {
      try {
        const result = provider.track(event as never)
        this.handleExecutionResult(result, event)
      } catch (error) {
        this.onError?.(error, event)
      }
    }
  }

  /**
   * Identify a user across providers
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    this.executeOnCapableProviders(hasIdentifyCapability, (provider) => {
      const identifyProvider = provider as BaseProvider<E> & IdentifyCapable
      return identifyProvider.identify(userId, traits)
    })
  }

  /**
   * Associate user with a group/organization
   */
  group(groupId: string, traits?: Record<string, unknown>): void {
    this.executeOnCapableProviders(hasGroupCapability, (provider) => {
      const groupProvider = provider as BaseProvider<E> & GroupCapable
      return groupProvider.group(groupId, traits)
    })
  }

  /**
   * Track page views
   */
  page(context?: PageContext): void {
    if (!this.shouldProcessEvent()) {
      return
    }

    // Merge page context with default context like track() does
    const mergedContext = shallowMerge(this.defaultContext, context as Partial<EventContext>)

    this.executeOnCapableProviders(hasPageCapability, (provider) => {
      const pageProvider = provider as BaseProvider<E> & PageCapable
      return pageProvider.page(mergedContext as PageContext)
    })
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
      if (!this.shouldProcessEvent()) {
        return
      }

      const { includeProviders, excludeProviders } = this.resolveProviderRouting(processedEvent, options)
      this.executeOnProviders(processedEvent, includeProviders, excludeProviders)
    }

    // Run through middleware pipeline
    const processed = this.middlewares.process(enriched as never, enriched.context)
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
        promises.push(
          Promise.resolve(entry.provider.flush()).catch((error) => {
            this.onError?.(error)
          }),
        )
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
   * Notify all providers of consent state changes
   */
  private notifyProvidersOfConsentChange(consentState: ConsentState): void {
    const entries = Array.from(this.providerMap.values())
    for (const entry of entries) {
      try {
        entry.provider.init?.({
          consent: consentState,
          defaultContext: this.defaultContext,
        })
      } catch (error) {
        this.onError?.(error)
      }
    }
  }

  /**
   * Initialize providers. Present for API compatibility in tests.
   */
  async init(): Promise<void> {
    // Initialize all providers with current consent and context
    await this.initializeAllProviders(this.consent.get())
  }

  /**
   * Initialize all providers with async support
   */
  private async initializeAllProviders(consentState: ConsentState): Promise<void> {
    const entries = Array.from(this.providerMap.values())
    const promises: Promise<void>[] = []

    for (const entry of entries) {
      if (entry.provider.init) {
        const initPromise = Promise.resolve(
          entry.provider.init({
            consent: consentState,
            defaultContext: this.defaultContext,
          }),
        ).catch((error) => {
          this.onError?.(error)
        })
        promises.push(initPromise)
      }
    }

    await Promise.all(promises)
  }

  /**
   * Shutdown all providers gracefully
   */
  async shutdown(): Promise<void> {
    const promises: Promise<void>[] = []
    const entries = Array.from(this.providerMap.values())
    for (const entry of entries) {
      if (entry.provider.shutdown) {
        promises.push(
          Promise.resolve(entry.provider.shutdown()).catch((error) => {
            this.onError?.(error)
          }),
        )
      }
    }
    await Promise.all(promises)
  }

  /**
   * Get the consent manager instance for external consent integration
   * Used by hooks to bridge Redux consent with analytics consent
   */
  getConsentManager(): ConsentManager {
    return this.consent
  }

  /**
   * Public providers list for tests and consumers
   */
  get providers(): BaseProvider<E>[] {
    return Array.from(this.providerMap.values()).map((e) => e.provider)
  }
}
