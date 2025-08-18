/**
 * Consent management for analytics tracking.
 * Provider-agnostic consent state management.
 */

import type { ConsentState, ConsentCategories } from './types'

type ConsentChangeListener = (state: ConsentState) => void

/**
 * Manages user consent for analytics tracking
 */
export class ConsentManager {
  private state: ConsentState
  private listeners: ConsentChangeListener[] = []

  constructor(initialState?: ConsentState) {
    this.state = {
      updatedAt: Date.now(),
      ...initialState,
    }
  }

  /**
   * Add a listener for consent state changes
   */
  addListener(listener: ConsentChangeListener): void {
    this.listeners.push(listener)
  }

  /**
   * Remove a listener
   */
  removeListener(listener: ConsentChangeListener): void {
    const index = this.listeners.indexOf(listener)
    if (index >= 0) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * Notify all listeners of consent state changes
   */
  private notifyListeners(): void {
    const currentState = this.get()
    this.listeners.forEach((listener) => {
      try {
        listener(currentState)
      } catch (error) {
        console.error('[ConsentManager] Listener error:', error)
      }
    })
  }

  /**
   * Update consent state with new preferences
   */
  update(patch: ConsentState): void {
    // Validate and clean the patch
    const validatedPatch = this.validateConsentPatch(patch)

    this.state = {
      ...this.state,
      ...validatedPatch,
      updatedAt: Date.now(),
    }
    this.notifyListeners()
  }

  /**
   * Validate consent patch to ensure necessary consent is always true
   * and filter out invalid categories
   */
  private validateConsentPatch(patch: Partial<ConsentState>): Partial<ConsentState> {
    const validatedPatch: Partial<ConsentState> = {}
    const validCategories = ['analytics', 'necessary']

    // Filter valid categories and ensure proper types
    for (const [key, value] of Object.entries(patch)) {
      if (key === 'updatedAt') {
        // Skip updatedAt as it's handled automatically
        continue
      }

      if (validCategories.includes(key) && typeof value === 'boolean') {
        // Ensure 'necessary' consent is always true
        if (key === 'necessary') {
          validatedPatch[key as ConsentCategories] = true
        } else {
          validatedPatch[key as ConsentCategories] = value
        }
      }
    }

    return validatedPatch
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

  /**
   * Compatibility API expected by existing tests
   */
  hasConsent(category: ConsentCategories): boolean {
    return this.allows(category)
  }

  hasAllConsents(categories: ConsentCategories[]): boolean {
    return categories.every((c) => this.allows(c))
  }

  hasAnyConsent(categories: ConsentCategories[]): boolean {
    return categories.some((c) => this.allows(c))
  }

  setConsent(consent: Partial<ConsentState>): void {
    this.update(consent as ConsentState)
  }

  setConsentForCategory(category: ConsentCategories, value: boolean): void {
    this.update({ [category]: value } as ConsentState)
  }

  /**
   * Alias for update() for API compatibility with tests
   */
  set(consent: Partial<ConsentState>): void {
    this.update(consent as ConsentState)
  }

  /**
   * Check multiple consent categories with mode support
   */
  has(categories: ConsentCategories[], options?: { mode?: 'all' | 'any' }): boolean {
    const mode = options?.mode || 'all'
    if (mode === 'any') {
      return this.hasAnyConsent(categories)
    }
    return this.hasAllConsents(categories)
  }

  getAllConsents(): ConsentState {
    return this.get()
  }

  getConsentFor(categories: ConsentCategories[]): Partial<ConsentState> {
    const all = this.get()
    const result: Partial<ConsentState> = {}
    categories.forEach((c) => {
      if (c in all) result[c] = all[c]
    })
    return result
  }

  /**
   * Enable analytics tracking
   * Provider-agnostic method for consent state management
   */
  enableAnalytics(): void {
    this.grant('analytics')
  }

  /**
   * Disable analytics tracking
   * Provider-agnostic method for consent state management
   */
  disableAnalytics(): void {
    this.revoke('analytics')
  }
}
