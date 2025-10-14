import { setSafeLabsTermsAccepted, getSafeLabsTermsAccepted, hasAcceptedSafeLabsTerms } from '../index'

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
})
