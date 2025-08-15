/**
 * Google Analytics-specific consent management.
 * Handles GA consent API calls, cookie deletion, and page reload.
 */

import Cookies from 'js-cookie'
import type { ConsentState } from '../core'

/**
 * Google Analytics consent handler with legacy parity
 */
export class GoogleAnalyticsConsentHandler {
  /**
   * Enable Google Analytics tracking with consent API
   * Mirrors legacy gtmEnableCookies() function
   */
  static enableAnalytics(): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      })
    }
  }

  /**
   * Delete all Google Analytics cookies
   * Extracted from legacy gtmDisableCookies() implementation
   */
  private static deleteCookies(): void {
    if (typeof document === 'undefined') return

    const GA_COOKIE_LIST = ['_ga', '_gat', '_gid']
    const GA_PREFIX = '_ga_'

    // Get all cookies and filter for GA cookies
    const allCookies = document.cookie.split(';').map((cookie) => cookie.split('=')[0].trim())
    const gaCookies = allCookies.filter((cookie) => cookie.startsWith(GA_PREFIX))

    // Delete all GA cookies
    GA_COOKIE_LIST.concat(gaCookies).forEach((cookie) => {
      Cookies.remove(cookie, {
        path: '/',
        domain: `.${location.host.split('.').slice(-2).join('.')}`,
      })
    })
  }

  /**
   * Disable Google Analytics tracking with consent API and cookie cleanup
   * Includes page reload to fully stop GA tracking (matches legacy gtmDisableCookies)
   */
  static disableAnalytics(): void {
    // Disable GA consent via gtag API
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      })
    }

    // Delete GA cookies
    this.deleteCookies()

    // CRITICAL: Reload page to ensure GA tracking fully stops
    // This matches the legacy behavior exactly
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  /**
   * Handle consent state changes for Google Analytics
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
