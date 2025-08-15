/**
 * Mixpanel-specific consent management.
 * Handles Mixpanel opt-in/opt-out tracking.
 */

import mixpanel from 'mixpanel-browser'
import type { ConsentState } from '../core'

/**
 * Mixpanel consent handler
 */
export class MixpanelConsentHandler {
  /**
   * Enable Mixpanel tracking
   */
  static enableAnalytics(): void {
    if (typeof window !== 'undefined' && mixpanel) {
      mixpanel.opt_in_tracking()
    }
  }

  /**
   * Disable Mixpanel tracking
   */
  static disableAnalytics(): void {
    if (typeof window !== 'undefined' && mixpanel) {
      mixpanel.opt_out_tracking()
    }
  }

  /**
   * Handle consent state changes for Mixpanel
   */
  static handleConsentChange(consentState: ConsentState): void {
    const analyticsEnabled = Boolean(consentState.analytics)

    if (analyticsEnabled) {
      this.enableAnalytics()
    } else {
      this.disableAnalytics()
    }
  }
}
