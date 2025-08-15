/**
 * Analytics Development Tools
 *
 * Utilities for debugging and validating analytics implementation.
 * These tools help developers:
 * - Debug what events are being sent to which providers
 * - Validate GA parameter registration
 * - Inspect event configurations
 * - Test analytics integration
 */

import { IS_PRODUCTION } from '@/config/constants'
import type { AnalyticsManager } from '../core/AnalyticsManager'
import type { EventConfiguration } from '../core/types'
import { GA_REGISTERED_PARAMETERS } from '../core/types'
import { ANALYTICS_EVENTS, validateEventConfigurations } from '../config/events.config'

export class AnalyticsDevTools {
  private manager?: AnalyticsManager

  constructor(manager?: AnalyticsManager) {
    this.manager = manager
  }

  /**
   * Set the analytics manager instance
   */
  setManager(manager: AnalyticsManager): void {
    this.manager = manager
  }

  /**
   * Debug what would be sent to each provider for a given event
   */
  debugEvent(eventKey: string, properties: Record<string, any> = {}): void {
    if (IS_PRODUCTION) {
      console.warn('[AnalyticsDevTools] Debug tools should not be used in production')
      return
    }

    const config = ANALYTICS_EVENTS[eventKey]
    if (!config) {
      console.error(`[AnalyticsDevTools] Unknown event: ${eventKey}`)
      return
    }

    console.group(`🔍 Analytics Debug: ${eventKey}`)

    // Show overall event configuration
    console.log('📋 Event Configuration:')
    console.table({
      'Event Key': eventKey,
      'GA Enabled': config.providers.ga?.enabled || false,
      'Mixpanel Enabled': config.providers.mixpanel?.enabled || false,
      'Total Properties': Object.keys(properties).length,
    })

    // Debug GA4 payload
    if (config.providers.ga?.enabled) {
      this.debugGAPayload(config, properties)
    }

    // Debug Mixpanel payload
    if (config.providers.mixpanel?.enabled) {
      this.debugMixpanelPayload(config, properties)
    }

    console.groupEnd()
  }

  /**
   * Validate all GA parameters in current event configurations
   */
  validateGAParameters(): { valid: boolean; issues: string[] } {
    const issues: string[] = []

    Object.entries(ANALYTICS_EVENTS).forEach(([eventKey, config]) => {
      if (config.providers.ga?.enabled) {
        const registeredParams = config.providers.ga.registeredParams || []

        registeredParams.forEach((param) => {
          if (!GA_REGISTERED_PARAMETERS.includes(param as any)) {
            issues.push(`Event "${eventKey}": Parameter "${param}" is not in GA_REGISTERED_PARAMETERS`)
          }
        })
      }
    })

    if (!IS_PRODUCTION && issues.length === 0) {
      console.info('✅ [AnalyticsDevTools] All GA parameters are properly registered')
    } else if (!IS_PRODUCTION && issues.length > 0) {
      console.warn('⚠️ [AnalyticsDevTools] GA parameter validation issues:')
      issues.forEach((issue) => console.warn(`  - ${issue}`))
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }

  /**
   * Check if a property would be sent to GA
   */
  wouldPropertyBeSentToGA(eventKey: string, propertyName: string): boolean {
    const config = ANALYTICS_EVENTS[eventKey]
    if (!config?.providers.ga?.enabled) {
      return false
    }

    return config.providers.ga.registeredParams?.includes(propertyName) || false
  }

  /**
   * Get comprehensive analytics status
   */
  getAnalyticsStatus(): {
    manager: {
      initialized: boolean
      providers: Record<string, { ready: boolean; name: string }>
    }
    configuration: {
      totalEvents: number
      gaEvents: number
      mixpanelEvents: number
      validConfiguration: boolean
      configurationErrors: string[]
    }
    parameters: {
      totalGAParameters: number
      validGAParameters: boolean
      parameterIssues: string[]
    }
  } {
    const configValidation = validateEventConfigurations()
    const paramValidation = this.validateGAParameters()

    const gaEvents = Object.keys(ANALYTICS_EVENTS).filter((key) => ANALYTICS_EVENTS[key].providers.ga?.enabled).length

    const mixpanelEvents = Object.keys(ANALYTICS_EVENTS).filter(
      (key) => ANALYTICS_EVENTS[key].providers.mixpanel?.enabled,
    ).length

    return {
      manager: {
        initialized: !!this.manager,
        providers: this.manager?.getProviderStatuses() || {},
      },
      configuration: {
        totalEvents: Object.keys(ANALYTICS_EVENTS).length,
        gaEvents,
        mixpanelEvents,
        validConfiguration: configValidation.valid,
        configurationErrors: configValidation.errors,
      },
      parameters: {
        totalGAParameters: GA_REGISTERED_PARAMETERS.length,
        validGAParameters: paramValidation.valid,
        parameterIssues: paramValidation.issues,
      },
    }
  }

  /**
   * Simulate tracking an event (dry run)
   */
  simulateEvent(
    eventKey: string,
    properties: Record<string, any> = {},
  ): {
    wouldTrack: boolean
    ga?: {
      enabled: boolean
      eventName?: string
      filteredProperties?: Record<string, any>
      droppedProperties?: string[]
    }
    mixpanel?: {
      enabled: boolean
      eventName?: string
      enrichedProperties?: Record<string, any>
    }
  } {
    const config = ANALYTICS_EVENTS[eventKey]
    if (!config) {
      return { wouldTrack: false }
    }

    const result: any = { wouldTrack: true }

    // Simulate GA processing
    if (config.providers.ga?.enabled) {
      const gaConfig = config.providers.ga
      const registeredProps: Record<string, any> = {}
      const droppedProperties: string[] = []

      Object.entries(properties).forEach(([key, value]) => {
        if (gaConfig.registeredParams?.includes(key)) {
          registeredProps[key] = value
        } else {
          droppedProperties.push(key)
        }
      })

      result.ga = {
        enabled: true,
        eventName: gaConfig.eventName,
        filteredProperties: registeredProps,
        droppedProperties,
      }
    } else {
      result.ga = { enabled: false }
    }

    // Simulate Mixpanel processing
    if (config.providers.mixpanel?.enabled) {
      const mixpanelConfig = config.providers.mixpanel
      let enrichedProperties = { ...properties }

      // Apply property transformation if configured
      if (mixpanelConfig.createProperties) {
        enrichedProperties = mixpanelConfig.createProperties(properties)
      }

      result.mixpanel = {
        enabled: true,
        eventName: mixpanelConfig.eventName,
        enrichedProperties,
      }
    } else {
      result.mixpanel = { enabled: false }
    }

    return result
  }

  /**
   * Generate a parameter validation report for GA
   */
  generateGAParameterReport(): string {
    let report = '📊 GA4 Parameter Registration Report\n'
    report += '=====================================\n\n'

    // List all registered parameters
    report += '✅ Registered Parameters:\n'
    GA_REGISTERED_PARAMETERS.forEach((param) => {
      report += `  - ${param}\n`
    })

    report += '\n📝 Usage in Events:\n'
    Object.entries(ANALYTICS_EVENTS).forEach(([eventKey, config]) => {
      if (config.providers.ga?.enabled) {
        report += `\n${eventKey}:\n`
        config.providers.ga.registeredParams?.forEach((param) => {
          const isRegistered = GA_REGISTERED_PARAMETERS.includes(param as any)
          const status = isRegistered ? '✅' : '❌'
          report += `  ${status} ${param}\n`
        })
      }
    })

    return report
  }

  /**
   * Test analytics integration
   */
  async testIntegration(): Promise<{
    success: boolean
    results: {
      manager: boolean
      ga: boolean
      mixpanel: boolean
    }
    errors: string[]
  }> {
    const errors: string[] = []
    const results = {
      manager: false,
      ga: false,
      mixpanel: false,
    }

    try {
      // Test manager
      if (!this.manager) {
        errors.push('Analytics manager not available')
      } else {
        results.manager = true

        // Test GA provider
        const gaProvider = this.manager.getProvider('ga')
        if (gaProvider) {
          results.ga = gaProvider.isReady()
          if (!results.ga) {
            errors.push('GA provider not ready')
          }
        } else {
          errors.push('GA provider not found')
        }

        // Test Mixpanel provider
        const mixpanelProvider = this.manager.getProvider('mixpanel')
        if (mixpanelProvider) {
          results.mixpanel = mixpanelProvider.isReady()
          if (!results.mixpanel) {
            errors.push('Mixpanel provider not ready')
          }
        } else {
          errors.push('Mixpanel provider not found')
        }
      }
    } catch (error) {
      errors.push(`Test integration failed: ${error}`)
    }

    return {
      success: errors.length === 0,
      results,
      errors,
    }
  }

  private debugGAPayload(config: EventConfiguration, properties: Record<string, any>): void {
    const gaConfig = config.providers.ga!

    console.log('📊 GA4 Payload:')
    console.log(`  Event Name: ${gaConfig.eventName}`)

    // Show which properties would be sent vs filtered
    const sentProperties: Record<string, any> = {}
    const filteredProperties: string[] = []

    Object.entries(properties).forEach(([key, value]) => {
      if (gaConfig.registeredParams?.includes(key)) {
        sentProperties[key] = value
      } else {
        filteredProperties.push(key)
      }
    })

    console.log('  ✅ Properties sent to GA:')
    if (Object.keys(sentProperties).length > 0) {
      console.table(sentProperties)
    } else {
      console.log('    (none)')
    }

    if (filteredProperties.length > 0) {
      console.log('  ❌ Properties filtered out:')
      console.log(`    ${filteredProperties.join(', ')}`)
      console.log('    💡 To use these, register them in GA4 and add to GA_REGISTERED_PARAMETERS')
    }
  }

  private debugMixpanelPayload(config: EventConfiguration, properties: Record<string, any>): void {
    const mixpanelConfig = config.providers.mixpanel!

    console.log('🎯 Mixpanel Payload:')
    console.log(`  Event Name: ${mixpanelConfig.eventName}`)

    let finalProperties = { ...properties }

    // Apply property transformation if configured
    if (mixpanelConfig.createProperties) {
      finalProperties = mixpanelConfig.createProperties(properties)
    }

    console.log('  📦 All properties sent to Mixpanel:')
    console.table(finalProperties)

    // Show enriched properties
    const enrichedKeys = Object.keys(finalProperties).filter((key) => !Object.keys(properties).includes(key))

    if (enrichedKeys.length > 0) {
      console.log('  ✨ Enriched properties:')
      console.log(`    ${enrichedKeys.join(', ')}`)
    }
  }
}

/**
 * Global dev tools instance (only available in development)
 */
export const analyticsDevTools = !IS_PRODUCTION ? new AnalyticsDevTools() : undefined

/**
 * Add analytics debug methods to window object in development
 */
if (!IS_PRODUCTION && typeof window !== 'undefined') {
  ;(window as any).__analyticsDevTools = {
    debug: (eventKey: string, properties?: Record<string, any>) => analyticsDevTools?.debugEvent(eventKey, properties),

    validate: () => analyticsDevTools?.validateGAParameters(),

    status: () => analyticsDevTools?.getAnalyticsStatus(),

    simulate: (eventKey: string, properties?: Record<string, any>) =>
      analyticsDevTools?.simulateEvent(eventKey, properties),

    report: () => console.log(analyticsDevTools?.generateGAParameterReport()),

    test: () => analyticsDevTools?.testIntegration(),
  }

  console.info(
    '🛠️ Analytics dev tools available at window.__analyticsDevTools\n' +
      'Available methods:\n' +
      '  - debug(eventKey, properties) - Debug event payload\n' +
      '  - validate() - Validate GA parameters\n' +
      '  - status() - Get system status\n' +
      '  - simulate(eventKey, properties) - Dry run event\n' +
      '  - report() - Generate parameter report\n' +
      '  - test() - Test integration',
  )
}
