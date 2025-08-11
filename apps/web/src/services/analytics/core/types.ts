/**
 * Core types for the analytics abstraction layer.
 * Defines the event system, context, and provider interfaces.
 */

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

// Safe-specific event catalog for type safety
export type SafeEventMap = Record<string, Record<string, unknown>>

export type DeviceInfo = {
  userAgent?: string
  screen?: { width?: number; height?: number; pixelRatio?: number }
}

export type PageContext = {
  url?: string
  referrer?: string
  title?: string
  path?: string
}

export type EventContext = {
  userId?: string // Safe address or user ID - NO PII like emails
  anonymousId?: string // Cookie/local ID before identification
  sessionId?: string
  page?: PageContext
  device?: DeviceInfo
  locale?: string
  appVersion?: string
  source?: 'web' | 'mobile' | 'server'
  test?: boolean // True during E2E tests
  chainId?: string // Blockchain network identifier
  safeAddress?: string // Safe wallet address
}

export type AnalyticsEvent<K extends string = string, P extends Record<string, unknown> = Record<string, unknown>> = {
  name: K
  payload: P
  context?: EventContext
  timestamp?: number // Epoch milliseconds
}

export type ProviderInitOptions = {
  consent?: ConsentState
  defaultContext?: EventContext
}

export type ConsentCategories = 'analytics' | 'marketing' | 'functional' | 'personalization' | 'necessary'
export type ConsentState = Partial<Record<ConsentCategories, boolean>> & { updatedAt?: number }

// Backwards compatibility aliases for tests
export type ConsentSettings = ConsentState
export type ConsentCategory = ConsentCategories

// Provider routing configuration
export type RouteDecision = {
  includeProviders?: string[]
  excludeProviders?: string[]
}

export type Router<E extends SafeEventMap> = (
  event: AnalyticsEvent<keyof E & string, E[keyof E & string]>,
) => RouteDecision | void

// Per-call routing overrides
export type TrackOptions = RouteDecision

// Analytics configuration
export type AnalyticsOptions<E extends SafeEventMap> = {
  defaultContext?: EventContext
  consent?: ConsentState
  queueKey?: string // localStorage key for offline queue
  queueTtlMs?: number // Queue item TTL
  queueMax?: number // Max queue size
  onError?: (err: unknown, event?: AnalyticsEvent) => void
  router?: Router<E> // Global event routing
}

/**
 * Utility to safely merge shallow objects
 */
export function shallowMerge<T extends object>(base: T, patch?: Partial<T>): T {
  return Object.assign({}, base, patch || {}) as T
}

/**
 * Legacy/simple middleware function signature expected in some tests
 * Provided for typing compatibility in test utilities
 */
export type MiddlewareFunction = (
  event: AnalyticsEvent<any, any>,
  context?: EventContext,
) => AnalyticsEvent<any, any> | null

// Test compatibility types
export type QueuedEvent = AnalyticsEvent<any, any>

// Re-export some interfaces here for tests importing from '../types'
export type { BaseProvider } from './provider'
