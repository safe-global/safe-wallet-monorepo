/**
 * Unit tests for ConsentManager
 */

import { ConsentManager } from '../consent'
import type { ConsentSettings, ConsentCategory } from '../types'

describe('ConsentManager', () => {
  let consentManager: ConsentManager

  beforeEach(() => {
    consentManager = new ConsentManager()
  })

  describe('Initialization', () => {
    it('should create ConsentManager with default consent (all false)', () => {
      expect(consentManager.hasConsent('analytics')).toBe(false)
      expect(consentManager.hasConsent('necessary')).toBe(false)
    })

    it('should create ConsentManager with initial consent settings', () => {
      const initialConsent: ConsentSettings = {
        analytics: true,
        necessary: true,
      }

      const manager = new ConsentManager(initialConsent)

      expect(manager.hasConsent('analytics')).toBe(true)
      expect(manager.hasConsent('necessary')).toBe(true)
    })

    it('should handle partial consent settings', () => {
      const partialConsent: Partial<ConsentSettings> = {
        analytics: true,
        necessary: true,
      }

      const manager = new ConsentManager(partialConsent)

      expect(manager.hasConsent('analytics')).toBe(true)
      expect(manager.hasConsent('necessary')).toBe(true)
    })
  })

  describe('Consent Checking', () => {
    beforeEach(() => {
      consentManager.setConsent({
        analytics: true,
        necessary: true,
      })
    })

    it('should check individual consent categories', () => {
      expect(consentManager.hasConsent('analytics')).toBe(true)
      expect(consentManager.hasConsent('necessary')).toBe(true)
    })

    it('should check multiple consent categories (AND logic)', () => {
      expect(consentManager.hasAllConsents(['analytics', 'necessary'])).toBe(true)

      // Set analytics to false to test AND logic
      consentManager.setConsent({ analytics: false })
      expect(consentManager.hasAllConsents(['analytics', 'necessary'])).toBe(false)
    })

    it('should check multiple consent categories (OR logic)', () => {
      expect(consentManager.hasAnyConsent(['analytics', 'necessary'])).toBe(true)

      // Set analytics to false, necessary should still be true
      consentManager.setConsent({ analytics: false })
      expect(consentManager.hasAnyConsent(['analytics', 'necessary'])).toBe(true)
    })

    it('should handle empty arrays gracefully', () => {
      expect(consentManager.hasAllConsents([])).toBe(true) // Vacuous truth
      expect(consentManager.hasAnyConsent([])).toBe(false)
    })

    it('should handle invalid categories gracefully', () => {
      expect(consentManager.hasConsent('invalid' as ConsentCategory)).toBe(false)
    })
  })

  describe('Consent Setting', () => {
    it('should set individual consent', () => {
      consentManager.setConsentForCategory('analytics', true)
      expect(consentManager.hasConsent('analytics')).toBe(true)
      expect(consentManager.hasConsent('necessary')).toBe(false) // Should default to false initially
    })

    it('should update individual consent', () => {
      consentManager.setConsentForCategory('analytics', true)
      expect(consentManager.hasConsent('analytics')).toBe(true)

      consentManager.setConsentForCategory('analytics', false)
      expect(consentManager.hasConsent('analytics')).toBe(false)
    })

    it('should set multiple consent categories at once', () => {
      const newConsent: ConsentSettings = {
        analytics: true,
        necessary: true,
      }

      consentManager.setConsent(newConsent)

      expect(consentManager.hasConsent('analytics')).toBe(true)
      expect(consentManager.hasConsent('necessary')).toBe(true)
    })

    it('should merge partial consent settings', () => {
      // Set initial consent
      consentManager.setConsent({
        analytics: true,
        necessary: true,
      })

      // Update analytics only
      consentManager.setConsent({
        analytics: false,
      })

      expect(consentManager.hasConsent('analytics')).toBe(false) // Updated
      expect(consentManager.hasConsent('necessary')).toBe(true) // Unchanged
    })
  })

  describe('Consent Retrieval', () => {
    beforeEach(() => {
      consentManager.setConsent({
        analytics: true,
        necessary: true,
      })
    })

    it('should get all consent settings', () => {
      const consent = consentManager.getAllConsents()

      expect(consent).toMatchObject({
        analytics: true,
        necessary: true,
      })
      expect(consent.updatedAt).toBeDefined()
    })

    it('should return copy of consent settings (not reference)', () => {
      const consent1 = consentManager.getAllConsents()
      const consent2 = consentManager.getAllConsents()

      expect(consent1).not.toBe(consent2) // Different objects
      expect(consent1).toEqual(consent2) // Same content

      // Modifying returned object shouldn't affect internal state
      consent1.analytics = false
      expect(consentManager.hasConsent('analytics')).toBe(true)
    })

    it('should get consent for specific categories', () => {
      const specificConsent = consentManager.getConsentFor(['analytics', 'necessary'])

      expect(specificConsent).toEqual({
        analytics: true,
        necessary: true,
      })
    })

    it('should handle empty category list', () => {
      const emptyConsent = consentManager.getConsentFor([])
      expect(emptyConsent).toEqual({})
    })
  })

  describe('Consent Validation', () => {
    it('should validate that necessary consent is always true', () => {
      // Necessary consent should be forced to true by validation
      consentManager.setConsentForCategory('necessary', false)

      // Necessary consent should be enforced to stay true
      expect(consentManager.hasConsent('necessary')).toBe(true)
    })

    it('should handle string-based category names', () => {
      consentManager.setConsentForCategory('analytics', true)
      expect(consentManager.hasConsent('analytics')).toBe(true)
    })
  })

  describe('Event-like Usage', () => {
    it('should work with analytics events requiring consent', () => {
      // Simulate checking consent before tracking
      const shouldTrackAnalytics = consentManager.hasConsent('analytics')
      expect(shouldTrackAnalytics).toBe(false)

      consentManager.setConsentForCategory('analytics', true)

      const shouldTrackAnalyticsAfterConsent = consentManager.hasConsent('analytics')
      expect(shouldTrackAnalyticsAfterConsent).toBe(true)
    })

    it('should work with multiple providers requiring different consent', () => {
      consentManager.setConsent({
        analytics: true,
        necessary: true,
      })

      // Google Analytics requires analytics consent
      const canUseGA = consentManager.hasConsent('analytics')
      expect(canUseGA).toBe(true)

      // Some provider might require both analytics and necessary
      const canUseCombined = consentManager.hasAllConsents(['analytics', 'necessary'])
      expect(canUseCombined).toBe(true)
    })
  })

  describe('Consent State Transitions', () => {
    it('should handle granting consent', () => {
      expect(consentManager.hasConsent('analytics')).toBe(false)

      consentManager.setConsentForCategory('analytics', true)

      expect(consentManager.hasConsent('analytics')).toBe(true)
    })

    it('should handle revoking consent', () => {
      consentManager.setConsentForCategory('analytics', true)
      expect(consentManager.hasConsent('analytics')).toBe(true)

      consentManager.setConsentForCategory('analytics', false)

      expect(consentManager.hasConsent('analytics')).toBe(false)
    })

    it('should handle bulk consent changes', () => {
      // Grant all consent
      consentManager.setConsent({
        analytics: true,
        necessary: true,
      })

      expect(consentManager.hasAllConsents(['analytics', 'necessary'])).toBe(true)

      // Revoke analytics consent (necessary should remain true)
      consentManager.setConsent({
        analytics: false,
        necessary: false, // This will be forced to true by validation
      })

      expect(consentManager.hasConsent('analytics')).toBe(false)
      expect(consentManager.hasConsent('necessary')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined/null consent values', () => {
      // Testing with any type to simulate runtime scenarios
      const manager = new ConsentManager({
        analytics: undefined as any,
        necessary: null as any,
      })

      // Should default to false for undefined/null values (filtered out by validation)
      expect(manager.has(['analytics'])).toBe(false)
      expect(manager.has(['necessary'])).toBe(false) // null gets filtered out, defaults to false
    })

    it('should handle empty consent object', () => {
      const manager = new ConsentManager({})

      expect(manager.has(['analytics'])).toBe(false)
      expect(manager.has(['necessary'])).toBe(false)
    })

    it('should maintain immutability', () => {
      const originalConsent = {
        analytics: true,
        necessary: true,
      }

      const manager = new ConsentManager(originalConsent)

      // Modifying original shouldn't affect manager
      originalConsent.analytics = false

      expect(manager.has(['analytics'])).toBe(true)
    })
  })
})
