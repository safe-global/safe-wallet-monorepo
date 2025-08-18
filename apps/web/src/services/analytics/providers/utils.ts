/**
 * Provider utility functions for event name normalization and data transformation.
 * Removes string literals and provides consistent, reusable logic.
 */

import type { SafeEventMap } from '../core/types'
import type { EventUnion } from '../events/catalog'

/**
 * Event name normalization strategies
 */
export const EventNormalization = {
  /**
   * Convert to snake_case for GA4 compatibility
   * GA4 requires lowercase alphanumeric + underscores only, max 40 chars
   */
  toSnakeCase: (eventName: string): string => {
    return eventName
      .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
      .replace(/[\s-]/g, '_') // spaces and hyphens to underscores
      .replace(/[^a-zA-Z0-9_]/g, '') // remove non-alphanumeric except underscores
      .toLowerCase()
      .substring(0, 40) // GA4 40-char limit
  },

  /**
   * Convert to PascalCase for Mixpanel naming conventions
   * Mixpanel prefers "Title Case" event names
   */
  toPascalCase: (eventName: string): string => {
    return eventName
      .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to space-separated
      .replace(/[_-]/g, ' ') // snake_case and kebab-case to spaces
      .replace(/\b\w/g, (char) => char.toUpperCase()) // capitalize each word
      .replace(/\s+/g, ' ') // normalize multiple spaces
      .trim()
  },

  /**
   * Convert property names to Title Case for Mixpanel
   */
  toTitleCase: (propertyName: string): string => {
    return propertyName
      .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to space-separated
      .replace(/_/g, ' ') // snake_case to space-separated
      .replace(/\b\w/g, (char) => char.toUpperCase()) // capitalize first letter of each word
  },
} as const

/**
 * GA4-specific event data transformation
 */
export const GA4Transform = {
  /**
   * Transform event payload to GA4 format
   * GA4 has specific parameter naming and value constraints
   */
  transformPayload: (payload: Record<string, unknown>): Record<string, unknown> => {
    const transformed: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        // Convert key to snake_case for GA4
        const normalizedKey = EventNormalization.toSnakeCase(key)

        // GA4 parameter value constraints
        if (typeof value === 'string') {
          // GA4 string values max 100 chars
          transformed[normalizedKey] = value.substring(0, 100)
        } else if (typeof value === 'number') {
          transformed[normalizedKey] = value
        } else if (typeof value === 'boolean') {
          transformed[normalizedKey] = value
        } else {
          // Convert complex values to strings
          transformed[normalizedKey] = String(value).substring(0, 100)
        }
      }
    }

    return transformed
  },

  /**
   * Extract standard GA4 event parameters from context
   */
  extractContextParams: (context?: any): Record<string, unknown> => {
    if (!context) return {}

    const params: Record<string, unknown> = {}

    // Standard context properties with specific handling
    if (context.chainId) {
      params.chain_id = context.chainId
    }
    if (context.safeAddress) {
      // Remove 0x prefix for GA4
      params.safe_address = context.safeAddress.replace(/^0x/, '')
    }
    if (context.userId) {
      params.user_id = ValidationUtils.sanitizeValue(context.userId)
    }
    if (context.source) {
      params.source = context.source
    }

    // Include any additional custom properties from context
    const knownContextProps = new Set([
      'chainId',
      'safeAddress',
      'userId',
      'source',
      'page',
      'device',
      'locale',
      'appVersion',
      'test',
      'anonymousId',
      'sessionId',
      'path',
      'url',
      'title',
    ])

    for (const [key, value] of Object.entries(context)) {
      if (!knownContextProps.has(key) && value !== undefined && value !== null) {
        // Convert custom property to snake_case for GA4
        const normalizedKey = EventNormalization.toSnakeCase(key)

        // Apply GA4 value constraints
        if (typeof value === 'string') {
          params[normalizedKey] = value.substring(0, 100)
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          params[normalizedKey] = value
        } else {
          params[normalizedKey] = String(value).substring(0, 100)
        }
      }
    }

    return params
  },
} as const

/**
 * Mixpanel-specific event data transformation
 */
export const MixpanelTransform = {
  /**
   * Transform event payload to Mixpanel format
   * Mixpanel uses Title Case property names
   */
  transformPayload: (payload: Record<string, unknown>): Record<string, unknown> => {
    const transformed: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        // Convert key to Title Case for Mixpanel
        const normalizedKey = EventNormalization.toTitleCase(key)
        transformed[normalizedKey] = value
      }
    }

    return transformed
  },

  /**
   * Extract standard Mixpanel properties from context
   */
  extractContextProperties: (context?: any): Record<string, unknown> => {
    if (!context) return {}

    const properties: Record<string, unknown> = {}

    // Standard context properties with specific handling
    if (context.chainId) {
      properties['Chain ID'] = context.chainId
    }
    if (context.safeAddress) {
      properties['Safe Address'] = context.safeAddress
    }
    if (context.userId) {
      properties['User ID'] = context.userId
    }
    if (context.source) {
      properties['Source'] = context.source
    }
    if (context.device?.userAgent) {
      properties['User Agent'] = context.device.userAgent
    }

    // Include any additional custom properties from context
    const knownContextProps = new Set([
      'chainId',
      'safeAddress',
      'userId',
      'source',
      'page',
      'device',
      'locale',
      'appVersion',
      'test',
      'anonymousId',
      'sessionId',
    ])

    for (const [key, value] of Object.entries(context)) {
      if (!knownContextProps.has(key) && value !== undefined && value !== null) {
        // Convert custom property to Title Case for Mixpanel
        const normalizedKey = EventNormalization.toTitleCase(key)
        properties[normalizedKey] = value
      }
    }

    return properties
  },

  /**
   * Transform user traits to Mixpanel user properties
   */
  transformUserTraits: (traits: Record<string, unknown>): Record<string, unknown> => {
    const transformed: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(traits)) {
      const propertyName = EventNormalization.toTitleCase(key)
      transformed[propertyName] = value
    }

    return transformed
  },
} as const

/**
 * Common validation utilities
 */
export const ValidationUtils = {
  /**
   * Check if a value is a valid event name
   */
  isValidEventName: (name: unknown): name is string => {
    return typeof name === 'string' && name.length > 0 && name.length <= 100
  },

  /**
   * Check if a value is a valid payload object
   */
  isValidPayload: (payload: unknown): payload is Record<string, unknown> => {
    return payload !== null && typeof payload === 'object' && !Array.isArray(payload)
  },

  /**
   * Validate that an unknown value is a valid analytics event
   */
  isValidEvent: <T extends SafeEventMap>(event: unknown): event is EventUnion<T> => {
    return (
      typeof event === 'object' &&
      event !== null &&
      'name' in event &&
      ValidationUtils.isValidEventName((event as { name: unknown }).name) &&
      'properties' in event &&
      ValidationUtils.isValidPayload((event as { properties: unknown }).properties)
    )
  },

  /**
   * Sanitize a value for analytics (remove PII, truncate, etc.)
   */
  sanitizeValue: (value: unknown): unknown => {
    if (typeof value === 'string') {
      // Remove potential PII patterns
      let sanitized = value
        .replace(/\b[\w._%+-]+@[\w.-]+\.[A-Z]{2,}\b/gi, '[email]') // Email addresses
        .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[card]') // Credit card numbers

      // For GA4 user IDs, convert to alphanumeric + underscores only
      // This assumes the value is being used as a user ID based on context
      if (sanitized.match(/^[a-zA-Z0-9\-_.@]+$/)) {
        sanitized = sanitized.replace(/[-]/g, '_') // Convert dashes to underscores for GA4
      }

      return sanitized.substring(0, 1000) // Reasonable length limit
    }
    return value
  },
} as const
