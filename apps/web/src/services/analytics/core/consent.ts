/**
 * Consent management for analytics tracking.
 * Integrates with the existing Safe wallet consent system.
 */

import type { ConsentState, ConsentCategories } from './types'

/**
 * Manages user consent for analytics tracking
 */
export class ConsentManager {
  private state: ConsentState

  constructor(initialState?: ConsentState) {
    this.state = {
      updatedAt: Date.now(),
      ...initialState,
    }
  }

  /**
   * Update consent state with new preferences
   */
  update(patch: ConsentState): void {
    this.state = {
      ...this.state,
      ...patch,
      updatedAt: Date.now(),
    }
  }

  /**
   * Get current consent state
   */
  get(): ConsentState {
    return { ...this.state }
  }

  /**
   * Check if a specific category is allowed
   * Default-deny unless explicitly granted
   */
  allows(category: ConsentCategories): boolean {
    return Boolean(this.state[category])
  }

  /**
   * Check if analytics tracking is allowed
   */
  allowsAnalytics(): boolean {
    return this.allows('analytics')
  }

  /**
   * Check if marketing tracking is allowed
   */
  allowsMarketing(): boolean {
    return this.allows('marketing')
  }

  /**
   * Grant consent for specific categories
   */
  grant(...categories: ConsentCategories[]): void {
    const update: Partial<ConsentState> = {}
    categories.forEach((category) => {
      update[category] = true
    })
    this.update(update)
  }

  /**
   * Revoke consent for specific categories
   */
  revoke(...categories: ConsentCategories[]): void {
    const update: Partial<ConsentState> = {}
    categories.forEach((category) => {
      update[category] = false
    })
    this.update(update)
  }

  /**
   * Check when consent was last updated
   */
  lastUpdated(): number | undefined {
    return this.state.updatedAt
  }
}
