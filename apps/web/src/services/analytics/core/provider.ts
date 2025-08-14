/**
 * Provider contracts following Interface Segregation Principle.
 * Base capabilities are required, extended capabilities are opt-in.
 */

import type { AnalyticsEvent, SafeEventMap, ProviderInitOptions, PageContext } from './types'
import type { EventUnion } from '../events/catalog'
import type { ProviderId } from '../providers/constants'

/**
 * Base provider interface - all providers must implement this
 */
export interface BaseProvider<
  E extends Record<string, Record<string, unknown>> = Record<string, Record<string, unknown>>,
> {
  /** Unique stable identifier (e.g., 'ga', 'mixpanel') */
  readonly id: ProviderId

  /** Initialize the provider with consent and context */
  init?(opts: ProviderInitOptions): Promise<void> | void

  /** Core capability: track events - new typed version */
  track(event: EventUnion<E>): void | Promise<void>

  /** Check if provider is currently enabled */
  isEnabled(): boolean

  /** Enable/disable the provider */
  setEnabled(enabled: boolean): void

  /** Flush any pending events */
  flush?(): Promise<void>

  /** Clean shutdown */
  shutdown?(): Promise<void>
}

/**
 * Optional capability: User identification
 */
export interface IdentifyCapable {
  identify(userId: string, traits?: Record<string, unknown>): void | Promise<void>
}

/**
 * Optional capability: Group/organization tracking
 */
export interface GroupCapable {
  group(groupId: string, traits?: Record<string, unknown>): void | Promise<void>
}

/**
 * Optional capability: Page view tracking
 */
export interface PageCapable {
  page(ctx?: PageContext): void | Promise<void>
}

/**
 * Type guards for checking provider capabilities
 */
export function hasIdentifyCapability(provider: any): provider is IdentifyCapable {
  return provider && typeof provider.identify === 'function'
}

export function hasGroupCapability(provider: any): provider is GroupCapable {
  return provider && typeof provider.group === 'function'
}

export function hasPageCapability(provider: any): provider is PageCapable {
  return provider && typeof provider.page === 'function'
}
