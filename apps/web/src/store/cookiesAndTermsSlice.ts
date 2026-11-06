import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '.'
import { version } from '@/markdown/terms/version'
import { isLockdown } from '@/features/encrypted-workspaces/services'

export enum CookieAndTermType {
  TERMS = 'terms',
  NECESSARY = 'necessary',
  UPDATES = 'updates',
  ANALYTICS = 'analytics',
}

export type CookiesAndTermsState = {
  [CookieAndTermType.TERMS]: boolean | undefined
  [CookieAndTermType.NECESSARY]: boolean | undefined
  [CookieAndTermType.UPDATES]: boolean | undefined
  [CookieAndTermType.ANALYTICS]: boolean | undefined
  termsVersion: string | undefined
}

export const cookiesAndTermsInitialState: CookiesAndTermsState = {
  [CookieAndTermType.TERMS]: undefined,
  [CookieAndTermType.NECESSARY]: undefined,
  [CookieAndTermType.UPDATES]: undefined,
  [CookieAndTermType.ANALYTICS]: undefined,
  termsVersion: undefined,
}

export const cookiesAndTermsSlice = createSlice({
  name: `cookies_terms`,
  initialState: cookiesAndTermsInitialState,
  reducers: {
    saveCookieAndTermConsent: (_, { payload }: PayloadAction<CookiesAndTermsState>) => payload,
  },
})

export const selectCookies = (state: RootState) => state[cookiesAndTermsSlice.name]

export const hasAcceptedTerms = (state: RootState): boolean => {
  const cookies = selectCookies(state)
  return cookies[CookieAndTermType.TERMS] === true && cookies.termsVersion === version
}

export const hasConsentFor = (state: RootState, type: CookieAndTermType): boolean => {
  if (isLockdown()) return false
  const cookies = selectCookies(state)
  return cookies[type] === true && cookies.termsVersion === version
}

export const { saveCookieAndTermConsent } = cookiesAndTermsSlice.actions
