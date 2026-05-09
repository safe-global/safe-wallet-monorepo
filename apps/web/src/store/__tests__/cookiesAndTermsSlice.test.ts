import {
  cookiesAndTermsSlice,
  cookiesAndTermsInitialState,
  saveCookieAndTermConsent,
  hasAcceptedTerms,
  hasConsentFor,
  CookieAndTermType,
  type CookiesAndTermsState,
} from '../cookiesAndTermsSlice'
import { version } from '@/markdown/terms/version'
import type { RootState } from '@/store'

describe('cookiesAndTermsSlice', () => {
  const { reducer } = cookiesAndTermsSlice

  describe('saveCookieAndTermConsent', () => {
    it('should replace the entire state', () => {
      const consent: CookiesAndTermsState = {
        [CookieAndTermType.TERMS]: true,
        [CookieAndTermType.NECESSARY]: true,
        [CookieAndTermType.UPDATES]: false,
        [CookieAndTermType.ANALYTICS]: false,
        termsVersion: version,
      }

      const state = reducer(cookiesAndTermsInitialState, saveCookieAndTermConsent(consent))

      expect(state).toEqual(consent)
    })
  })

  describe('hasAcceptedTerms', () => {
    it('returns true when terms are accepted with current version', () => {
      const rootState = {
        cookies_terms: {
          [CookieAndTermType.TERMS]: true,
          [CookieAndTermType.NECESSARY]: true,
          [CookieAndTermType.UPDATES]: false,
          [CookieAndTermType.ANALYTICS]: false,
          termsVersion: version,
        },
      } as unknown as RootState

      expect(hasAcceptedTerms(rootState)).toBe(true)
    })

    it('returns false when terms are not accepted', () => {
      const rootState = {
        cookies_terms: {
          ...cookiesAndTermsInitialState,
          [CookieAndTermType.TERMS]: false,
          termsVersion: version,
        },
      } as unknown as RootState

      expect(hasAcceptedTerms(rootState)).toBe(false)
    })

    it('returns false when terms version does not match', () => {
      const rootState = {
        cookies_terms: {
          ...cookiesAndTermsInitialState,
          [CookieAndTermType.TERMS]: true,
          termsVersion: '0.0',
        },
      } as unknown as RootState

      expect(hasAcceptedTerms(rootState)).toBe(false)
    })
  })

  describe('hasConsentFor', () => {
    it('returns true for consented type with current version', () => {
      const rootState = {
        cookies_terms: {
          ...cookiesAndTermsInitialState,
          [CookieAndTermType.ANALYTICS]: true,
          termsVersion: version,
        },
      } as unknown as RootState

      expect(hasConsentFor(rootState, CookieAndTermType.ANALYTICS)).toBe(true)
    })

    it('returns false for non-consented type', () => {
      const rootState = {
        cookies_terms: {
          ...cookiesAndTermsInitialState,
          [CookieAndTermType.ANALYTICS]: false,
          termsVersion: version,
        },
      } as unknown as RootState

      expect(hasConsentFor(rootState, CookieAndTermType.ANALYTICS)).toBe(false)
    })

    it('returns false when version mismatches', () => {
      const rootState = {
        cookies_terms: {
          ...cookiesAndTermsInitialState,
          [CookieAndTermType.ANALYTICS]: true,
          termsVersion: '0.0',
        },
      } as unknown as RootState

      expect(hasConsentFor(rootState, CookieAndTermType.ANALYTICS)).toBe(false)
    })
  })
})
