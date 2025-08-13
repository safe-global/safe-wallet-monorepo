/**
 * Core types for the analytics abstraction layer.
 * Defines the event system, context, and provider interfaces.
 */

// Re-export the new type system
export type { EventName, EventMap, EventUnion } from '../events/catalog'
export type { ProviderId, RouteDecision, Router, TrackOptions } from '../providers/constants'

// Import types for inline usage
import type { EventUnion } from '../events/catalog'
import type { Router } from '../providers/constants'

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

// Backwards compatibility - use EventMap instead
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

// Legacy event type for backwards compatibility
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

// Analytics configuration using new typed system
export type AnalyticsOptions<E extends Record<string, Record<string, unknown>>> = {
  defaultContext?: EventContext
  consent?: ConsentState
  queueKey?: string // localStorage key for offline queue
  queueTtlMs?: number // Queue item TTL
  queueMax?: number // Max queue size
  onError?: (err: unknown, event?: EventUnion<E>) => void
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

// Re-export provider interfaces
export type { BaseProvider } from './provider'
