/**
 * Provider constants to replace string literals in routing and configuration.
 * This ensures type safety and prevents typos in provider IDs.
 */
import type { EventUnion } from '../events/catalog'

/**
 * Provider ID constants - use these instead of string literals
 */
export const PROVIDER = {
  GA: 'ga',
  GA_SAFE_APPS: 'ga_safe_apps', // Safe Apps ecosystem GA property
  Mixpanel: 'mixpanel',
  Custom: 'custom',
  Mock: 'mock', // For testing
} as const

/**
 * Type-safe provider ID union
 */
export type ProviderId = (typeof PROVIDER)[keyof typeof PROVIDER]

/**
 * Route decision type using typed provider IDs
 */
export type RouteDecision = {
  includeProviders?: readonly ProviderId[]
  excludeProviders?: readonly ProviderId[]
}

/**
 * Router function type that uses typed events and provider IDs
 */
export type Router<E extends Record<string, Record<string, unknown>>> = (event: EventUnion<E>) => RouteDecision | void

/**
 * Track options type for per-call routing overrides
 */
export type TrackOptions = RouteDecision

/**
 * Utility function to check if a string is a valid provider ID
 */
export const isValidProviderId = (id: string): id is ProviderId => {
  return Object.values(PROVIDER).includes(id as ProviderId)
}

/**
 * Get all available provider IDs
 */
export const getAllProviderIds = (): ProviderId[] => {
  return Object.values(PROVIDER)
}
