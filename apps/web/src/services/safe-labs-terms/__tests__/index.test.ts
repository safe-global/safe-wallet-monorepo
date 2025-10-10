import {
  setSafeLabsTermsAccepted,
  getSafeLabsTermsAccepted,
  hasAcceptedSafeLabsTerms,
  clearUserData,
  SAFE_LABS_TERMS_KEY,
} from '../index'
import { LS_NAMESPACE } from '@/config/constants'

describe('safe-labs-terms service', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  describe('setSafeLabsTermsAccepted', () => {
    it('should set the terms acceptance flag to true', () => {
      setSafeLabsTermsAccepted()
      expect(getSafeLabsTermsAccepted()).toBe(true)
    })
  })

  describe('getSafeLabsTermsAccepted', () => {
    it('should return null when terms have not been accepted', () => {
      expect(getSafeLabsTermsAccepted()).toBe(null)
    })

    it('should return true when terms have been accepted', () => {
      setSafeLabsTermsAccepted()
      expect(getSafeLabsTermsAccepted()).toBe(true)
    })
  })

  describe('hasAcceptedSafeLabsTerms', () => {
    it('should return false when terms have not been accepted', () => {
      expect(hasAcceptedSafeLabsTerms()).toBe(false)
    })

    it('should return true when terms have been accepted', () => {
      setSafeLabsTermsAccepted()
      expect(hasAcceptedSafeLabsTerms()).toBe(true)
    })
  })

  describe('clearUserData', () => {
    it('should clear all localStorage data', () => {
      // Set up some test data
      window.localStorage.setItem(`${LS_NAMESPACE}addressBook`, JSON.stringify({ test: 'data1' }))
      window.localStorage.setItem(`${LS_NAMESPACE}addedSafes`, JSON.stringify({ test: 'data2' }))
      window.localStorage.setItem(`${LS_NAMESPACE}settings`, JSON.stringify({ test: 'data3' }))
      window.localStorage.setItem('some-other-key', 'other-data')
      setSafeLabsTermsAccepted()

      // Verify data is present
      expect(window.localStorage.length).toBeGreaterThan(0)

      // Clear user data
      clearUserData()

      // Verify all data is cleared
      expect(window.localStorage.length).toBe(0)
      expect(window.localStorage.getItem(`${LS_NAMESPACE}addressBook`)).toBe(null)
      expect(window.localStorage.getItem(`${LS_NAMESPACE}addedSafes`)).toBe(null)
      expect(window.localStorage.getItem(`${LS_NAMESPACE}settings`)).toBe(null)
      expect(window.localStorage.getItem(`${LS_NAMESPACE}${SAFE_LABS_TERMS_KEY}`)).toBe(null)
      expect(window.localStorage.getItem('some-other-key')).toBe(null)
    })

    it('should handle empty localStorage', () => {
      // Clear user data when localStorage is empty
      expect(() => clearUserData()).not.toThrow()
      expect(window.localStorage.length).toBe(0)
    })

    it('should handle errors gracefully', () => {
      // Set up test data
      window.localStorage.setItem(`${LS_NAMESPACE}testKey`, 'test')

      // Store the original clear method
      const originalClear = Storage.prototype.clear
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      // Mock clear on Storage prototype to throw an error
      Storage.prototype.clear = jest.fn(() => {
        throw new Error('Mock error')
      })

      // Should not throw even when clear fails
      expect(() => clearUserData()).not.toThrow()

      // Verify the mock was called and error was logged
      expect(Storage.prototype.clear).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Restore
      Storage.prototype.clear = originalClear
      consoleErrorSpy.mockRestore()
    })
  })
})
