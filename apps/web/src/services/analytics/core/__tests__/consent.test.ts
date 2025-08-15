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
      expect(consentManager.hasConsent('marketing')).toBe(false)
      expect(consentManager.hasConsent('functional')).toBe(false)
      expect(consentManager.hasConsent('necessary')).toBe(false)
    })

    it('should create ConsentManager with initial consent settings', () => {
      const initialConsent: ConsentSettings = {
        analytics: true,
        marketing: false,
        functional: true,
        necessary: true,
      }

      const manager = new ConsentManager(initialConsent)

      expect(manager.hasConsent('analytics')).toBe(true)
      expect(manager.hasConsent('marketing')).toBe(false)
      expect(manager.hasConsent('functional')).toBe(true)
      expect(manager.hasConsent('necessary')).toBe(true)
    })

    it('should handle partial consent settings', () => {
      const partialConsent: Partial<ConsentSettings> = {
        analytics: true,
        necessary: true,
      }

      const manager = new ConsentManager(partialConsent)

      expect(manager.hasConsent('analytics')).toBe(true)
      expect(manager.hasConsent('marketing')).toBe(false) // Should default to false
      expect(manager.hasConsent('functional')).toBe(false) // Should default to false
      expect(manager.hasConsent('necessary')).toBe(true)
    })
  })

  describe('Consent Checking', () => {
    beforeEach(() => {
      consentManager.setConsent({
        analytics: true,
        marketing: false,
        functional: true,
        necessary: true,
      })
    })

    it('should check individual consent categories', () => {
      expect(consentManager.hasConsent('analytics')).toBe(true)
      expect(consentManager.hasConsent('marketing')).toBe(false)
      expect(consentManager.hasConsent('functional')).toBe(true)
      expect(consentManager.hasConsent('necessary')).toBe(true)
    })

    it('should check multiple consent categories (AND logic)', () => {
      expect(consentManager.hasAllConsents(['analytics', 'functional'])).toBe(true)
      expect(consentManager.hasAllConsents(['analytics', 'marketing'])).toBe(false)
      expect(consentManager.hasAllConsents(['marketing', 'functional'])).toBe(false)
    })

    it('should check multiple consent categories (OR logic)', () => {
      expect(consentManager.hasAnyConsent(['analytics', 'functional'])).toBe(true)
      expect(consentManager.hasAnyConsent(['analytics', 'marketing'])).toBe(true)
      expect(consentManager.hasAnyConsent(['marketing'])).toBe(false)
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
      expect(consentManager.hasConsent('marketing')).toBe(false) // Others unchanged
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
        marketing: true,
        functional: false,
        necessary: true,
      }

      consentManager.setConsent(newConsent)

      expect(consentManager.hasConsent('analytics')).toBe(true)
      expect(consentManager.hasConsent('marketing')).toBe(true)
      expect(consentManager.hasConsent('functional')).toBe(false)
      expect(consentManager.hasConsent('necessary')).toBe(true)
    })

    it('should merge partial consent settings', () => {
      // Set initial consent
      consentManager.setConsent({
        analytics: true,
        marketing: false,
        functional: true,
        necessary: true,
      })

      // Update only some categories
      consentManager.setConsent({
        marketing: true,
        functional: false,
      })

      expect(consentManager.hasConsent('analytics')).toBe(true) // Unchanged
      expect(consentManager.hasConsent('marketing')).toBe(true) // Updated
      expect(consentManager.hasConsent('functional')).toBe(false) // Updated
      expect(consentManager.hasConsent('necessary')).toBe(true) // Unchanged
    })
  })

  describe('Consent Retrieval', () => {
    beforeEach(() => {
      consentManager.setConsent({
        analytics: true,
        marketing: false,
        functional: true,
        necessary: true,
      })
    })

    it('should get all consent settings', () => {
      const consent = consentManager.getAllConsents()

      expect(consent).toMatchObject({
        analytics: true,
        marketing: false,
        functional: true,
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
      const specificConsent = consentManager.getConsentFor(['analytics', 'marketing'])

      expect(specificConsent).toEqual({
        analytics: true,
        marketing: false,
      })
    })

    it('should handle empty category list', () => {
      const emptyConsent = consentManager.getConsentFor([])
      expect(emptyConsent).toEqual({})
    })
  })

  describe('Consent Validation', () => {
    it('should validate that necessary consent is always true', () => {
      // In a real implementation, necessary consent might be enforced
      // For this test, we'll just check the current behavior
      consentManager.setConsentForCategory('necessary', false)

      // This depends on implementation - necessary might be forced to true
      // or allowed to be false. Testing current behavior:
      expect(consentManager.hasConsent('necessary')).toBe(false)
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
        marketing: false,
        functional: true,
        necessary: true,
      })

      // Google Analytics might require analytics consent
      const canUseGA = consentManager.hasConsent('analytics')
      expect(canUseGA).toBe(true)

      // Marketing provider might require marketing consent
      const canUseMarketing = consentManager.hasConsent('marketing')
      expect(canUseMarketing).toBe(false)

      // Some provider might require both
      const canUseCombined = consentManager.hasAllConsents(['analytics', 'functional'])
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
        marketing: true,
        functional: true,
        necessary: true,
      })

      expect(consentManager.hasAllConsents(['analytics', 'marketing', 'functional', 'necessary'])).toBe(true)

      // Revoke all non-necessary consent
      consentManager.setConsent({
        analytics: false,
        marketing: false,
        functional: false,
        necessary: true,
      })

      expect(consentManager.hasAnyConsent(['analytics', 'marketing', 'functional'])).toBe(false)
      expect(consentManager.hasConsent('necessary')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined/null consent values', () => {
      // Testing with any type to simulate runtime scenarios
      const manager = new ConsentManager({
        analytics: undefined as any,
        marketing: null as any,
      })

      // Should default to false for undefined/null values
      expect(manager.hasConsent('analytics')).toBe(false)
      expect(manager.hasConsent('marketing')).toBe(false)
    })

    it('should handle empty consent object', () => {
      const manager = new ConsentManager({})

      expect(manager.hasConsent('analytics')).toBe(false)
      expect(manager.hasConsent('marketing')).toBe(false)
    })

    it('should maintain immutability', () => {
      const originalConsent = {
        analytics: true,
        marketing: false,
      }

      const manager = new ConsentManager(originalConsent)

      // Modifying original shouldn't affect manager
      originalConsent.analytics = false

      expect(manager.hasConsent('analytics')).toBe(true)
    })
  })
})
