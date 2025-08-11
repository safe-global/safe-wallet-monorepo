/**
 * Core analytics abstraction layer exports.
 * Provides the foundation for the Safe wallet analytics system.
 */

// Core classes
export { Analytics } from './analytics'
export { AnalyticsBuilder, createAnalytics } from './builder'
export { MiddlewareChain } from './middleware'
export { PersistentQueue } from './queue'
export { ConsentManager } from './consent'

// Provider contracts
export type { BaseProvider, IdentifyCapable, GroupCapable, PageCapable } from './provider'
export { hasIdentifyCapability, hasGroupCapability, hasPageCapability } from './provider'

// Types
export type {
  SafeEventMap,
  AnalyticsEvent,
  EventContext,
  PageContext,
  DeviceInfo,
  ConsentState,
  ConsentCategories,
  ProviderInitOptions,
  Router,
  RouteDecision,
  TrackOptions,
  AnalyticsOptions,
  Json,
} from './types'
export { shallowMerge } from './types'

// Middleware types
export type { Middleware } from './middleware'
