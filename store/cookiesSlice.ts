import { isBeamerLoaded, loadBeamer, unloadBeamer } from '@/services/beamer'
import { createSlice, Middleware, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'

export enum CookieType {
  NECESSARY = 'necessary',
  UPDATES = 'updates',
  ANALYTICS = 'analytics',
}

type CookiesState = Record<CookieType, boolean>

const initialState: CookiesState = {
  [CookieType.NECESSARY]: false,
  [CookieType.UPDATES]: false,
  [CookieType.ANALYTICS]: false,
}

export const cookiesSlice = createSlice({
  name: 'cookies',
  initialState,
  reducers: {
    saveCookieConsent: (state, { payload }: PayloadAction<CookiesState>) => {
      return payload
    },
  },
})

export const { saveCookieConsent } = cookiesSlice.actions

export const selectCookies = (state: RootState) => state[cookiesSlice.name]

export const cookiesMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action)

  switch (action.type) {
    case saveCookieConsent.type: {
      const state = store.getState()

      if (state.cookies[CookieType.UPDATES]) {
        if (!isBeamerLoaded()) {
          loadBeamer()
        }
      } else {
        unloadBeamer()
      }

      if (state.cookies[CookieType.ANALYTICS]) {
        // TODO: If Analytics isn't loaded, load
      } else {
        // TODO: Unload Analytics
      }
    }
  }

  return result
}
