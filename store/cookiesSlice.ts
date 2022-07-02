import { isBeamerLoaded, loadBeamer, unloadBeamer } from '@/services/beamer'
import { createSlice, Middleware, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'

export const NECESSARY_COOKIE = 'necessary'
export const SUPPORT_COOKIE = 'supportAndCommunity'
export const ANALYTICS_COOKIE = 'analytics'

export type CookieConsent = {
  [NECESSARY_COOKIE]: boolean
  [SUPPORT_COOKIE]: boolean
  [ANALYTICS_COOKIE]: boolean
}

type CookiesState = {
  open: boolean
  consent: CookieConsent
  warningKey?: keyof CookieConsent
}

const initialState: CookiesState = {
  open: true,
  consent: {
    [NECESSARY_COOKIE]: true,
    [SUPPORT_COOKIE]: false,
    [ANALYTICS_COOKIE]: false,
  },
}

export const cookiesSlice = createSlice({
  name: 'cookies',
  initialState,
  reducers: {
    closeCookieBanner: (state) => {
      state.open = false
      delete state.warningKey
    },
    openCookieBanner: (state, action?: PayloadAction<{ consentWarning: keyof CookieConsent }>) => {
      state.open = true
      if (action?.payload.consentWarning) {
        state.warningKey = action.payload.consentWarning
      }
    },
    saveCookieConsent: (state, { payload }: PayloadAction<{ consent: CookieConsent }>) => {
      state.consent = payload.consent
    },
  },
})

export const { closeCookieBanner, openCookieBanner, saveCookieConsent } = cookiesSlice.actions

export const selectCookies = (state: RootState) => state[cookiesSlice.name]

export const cookiesMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action)

  switch (action.type) {
    case saveCookieConsent.type: {
      const state = store.getState()

      if (state.cookies.consent.supportAndCommunity) {
        if (!isBeamerLoaded()) {
          loadBeamer()
        }
      } else {
        unloadBeamer()
      }

      if (state.cookies.consent.analytics) {
        // TODO: If Analytics isn't loaded, load
      } else {
        // TODO: Unload Analytics
      }
    }
  }

  return result
}
