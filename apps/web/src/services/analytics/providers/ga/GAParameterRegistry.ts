/**
 * Google Analytics Parameter Registry
 *
 * Manages which custom parameters are registered in GA4 and can be sent with events.
 * GA4 requires custom parameters to be pre-registered in the dashboard before they
 * can be used in reports and analysis.
 *
 * Important: When adding new parameters here, ensure they are also registered
 * in your GA4 property settings under Configure > Custom Definitions > Custom metrics/dimensions.
 */

import { IS_PRODUCTION } from '@/config/constants'
import { GA_REGISTERED_PARAMETERS } from '../../core/types'

export class GAParameterRegistry {
  private registeredParams: Set<string>

  constructor() {
    // Initialize with our pre-registered parameters
    this.registeredParams = new Set(GA_REGISTERED_PARAMETERS)
  }

  /**
   * Filter event properties to only include parameters registered in GA4
   */
  filterParameters(properties: Record<string, any> = {}): Record<string, any> {
    const filtered: Record<string, any> = {}
    const unregistered: string[] = []

    Object.entries(properties).forEach(([key, value]) => {
      if (this.isRegistered(key)) {
        // Transform the value to GA-appropriate format
        filtered[key] = this.transformValueForGA(value)
      } else {
        unregistered.push(key)
      }
    })

    // Log warnings for unregistered parameters in development
    if (!IS_PRODUCTION && unregistered.length > 0) {
      console.warn(
        '[GA Parameter Registry] Unregistered parameters filtered out:',
        unregistered,
        '\nTo use these parameters, register them in GA4 dashboard and add to GA_REGISTERED_PARAMETERS',
      )
    }

    return filtered
  }

  /**
   * Check if a parameter is registered for use in GA4
   */
  isRegistered(parameterName: string): boolean {
    return this.registeredParams.has(parameterName)
  }

  /**
   * Get all registered parameter names
   */
  getRegisteredParameters(): string[] {
    return Array.from(this.registeredParams).sort()
  }

  /**
   * Add a new registered parameter (use with caution - must be registered in GA4 first)
   */
  addRegisteredParameter(parameterName: string): void {
    if (!IS_PRODUCTION) {
      console.warn(
        `[GA Parameter Registry] Adding parameter "${parameterName}". ` +
          'Ensure it is registered in your GA4 dashboard first.',
      )
    }
    this.registeredParams.add(parameterName)
  }

  /**
   * Validate that all parameters in a list are registered
   */
  validateParameters(parameters: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = []
    const invalid: string[] = []

    parameters.forEach((param) => {
      if (this.isRegistered(param)) {
        valid.push(param)
      } else {
        invalid.push(param)
      }
    })

    return { valid, invalid }
  }

  /**
   * Get detailed information about parameter registration status
   */
  getParameterInfo(properties: Record<string, any> = {}): {
    registered: Array<{ key: string; value: any; transformed: any }>
    unregistered: Array<{ key: string; value: any }>
    total: number
  } {
    const registered: Array<{ key: string; value: any; transformed: any }> = []
    const unregistered: Array<{ key: string; value: any }> = []

    Object.entries(properties).forEach(([key, value]) => {
      if (this.isRegistered(key)) {
        registered.push({
          key,
          value,
          transformed: this.transformValueForGA(value),
        })
      } else {
        unregistered.push({ key, value })
      }
    })

    return {
      registered,
      unregistered,
      total: Object.keys(properties).length,
    }
  }

  /**
   * Transform values to GA-appropriate formats
   * GA4 has specific requirements for parameter values
   */
  private transformValueForGA(value: any): any {
    // GA4 parameters should be strings or numbers
    if (value === null || value === undefined) {
      return ''
    }

    // Convert boolean to string
    if (typeof value === 'boolean') {
      return value.toString()
    }

    // Convert numbers to strings (GA4 prefers string values)
    if (typeof value === 'number') {
      return value.toString()
    }

    // Convert arrays to comma-separated strings (GA4 doesn't support arrays)
    if (Array.isArray(value)) {
      return value.join(',')
    }

    // Convert objects to JSON strings (not recommended, but sometimes necessary)
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value)
      } catch {
        return '[object Object]'
      }
    }

    // Ensure strings are not too long (GA4 has limits)
    if (typeof value === 'string' && value.length > 100) {
      if (!IS_PRODUCTION) {
        console.warn(`[GA Parameter Registry] Parameter value truncated (>100 chars):`, value.substring(0, 50) + '...')
      }
      return value.substring(0, 100)
    }

    return value
  }
}

/**
 * Parameter name validation for GA4
 * GA4 has specific naming requirements for custom parameters
 */
export class GAParameterValidator {
  /**
   * Validate parameter name against GA4 requirements
   */
  static validateParameterName(name: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Must not be empty
    if (!name || name.trim().length === 0) {
      errors.push('Parameter name cannot be empty')
    }

    // Must not exceed 40 characters
    if (name.length > 40) {
      errors.push('Parameter name must be 40 characters or fewer')
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(name)) {
      errors.push('Parameter name must start with a letter')
    }

    // Can only contain letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      errors.push('Parameter name can only contain letters, numbers, and underscores')
    }

    // Cannot start with "google_" or "ga_" (reserved)
    if (/^(google_|ga_)/i.test(name)) {
      errors.push('Parameter name cannot start with "google_" or "ga_" (reserved prefixes)')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Generate GA4-compliant parameter name from any string
   */
  static normalizeParameterName(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_') // Replace non-alphanumeric chars with underscore
      .replace(/^[^a-z]/i, 'param_') // Ensure starts with letter
      .substring(0, 40) // Limit to 40 characters
      .replace(/_{2,}/g, '_') // Remove multiple consecutive underscores
      .replace(/_$/, '') // Remove trailing underscore
  }
}

// Singleton instance
export const gaParameterRegistry = new GAParameterRegistry()
