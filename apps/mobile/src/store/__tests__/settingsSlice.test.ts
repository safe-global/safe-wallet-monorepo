import settingsReducer, {
  setTokenList,
  selectTokenList,
  setDataCollectionConsented,
  selectDataCollectionConsented,
  TOKEN_LISTS,
  type SettingsState,
} from '../settingsSlice'
import { configureStore } from '@reduxjs/toolkit'
import type { RootState } from '../index'

describe('settingsSlice', () => {
  const initialState: SettingsState = {
    onboardingVersionSeen: '',
    themePreference: 'auto',
    currency: 'usd',
    tokenList: TOKEN_LISTS.TRUSTED,
    hideDust: true,
    preferFiatInput: true,
    dataCollectionConsented: false,
    env: {
      rpc: {},
      tenderly: {
        url: '',
        accessToken: '',
      },
    },
  }

  describe('setTokenList', () => {
    it('should set tokenList to TRUSTED', () => {
      const previousState = { ...initialState, tokenList: TOKEN_LISTS.ALL }
      const state = settingsReducer(previousState, setTokenList(TOKEN_LISTS.TRUSTED))
      expect(state.tokenList).toBe(TOKEN_LISTS.TRUSTED)
    })

    it('should set tokenList to ALL', () => {
      const previousState = { ...initialState, tokenList: TOKEN_LISTS.TRUSTED }
      const state = settingsReducer(previousState, setTokenList(TOKEN_LISTS.ALL))
      expect(state.tokenList).toBe(TOKEN_LISTS.ALL)
    })
  })

  describe('selectTokenList', () => {
    it('should select tokenList from state', () => {
      const store = configureStore({
        reducer: {
          settings: settingsReducer,
        },
        preloadedState: {
          settings: initialState,
        },
      })

      const state = store.getState() as RootState
      expect(selectTokenList(state)).toBe(TOKEN_LISTS.TRUSTED)
    })

    it('should return TRUSTED as default when tokenList is undefined', () => {
      const store = configureStore({
        reducer: {
          settings: settingsReducer,
        },
        preloadedState: {
          settings: {
            ...initialState,
            tokenList: undefined as unknown as TOKEN_LISTS,
          },
        },
      })

      const state = store.getState() as RootState
      expect(selectTokenList(state)).toBe(TOKEN_LISTS.TRUSTED)
    })
  })

  describe('setDataCollectionConsented', () => {
    it('should set dataCollectionConsented to true', () => {
      const state = settingsReducer(initialState, setDataCollectionConsented(true))
      expect(state.dataCollectionConsented).toBe(true)
    })

    it('should set dataCollectionConsented to false', () => {
      const previousState = { ...initialState, dataCollectionConsented: true }
      const state = settingsReducer(previousState, setDataCollectionConsented(false))
      expect(state.dataCollectionConsented).toBe(false)
    })
  })

  describe('selectDataCollectionConsented', () => {
    it('should default to false', () => {
      const store = configureStore({
        reducer: { settings: settingsReducer },
        preloadedState: { settings: initialState },
      })
      const state = store.getState() as RootState
      expect(selectDataCollectionConsented(state)).toBe(false)
    })

    it('should return true when set', () => {
      const store = configureStore({
        reducer: { settings: settingsReducer },
        preloadedState: { settings: { ...initialState, dataCollectionConsented: true } },
      })
      const state = store.getState() as RootState
      expect(selectDataCollectionConsented(state)).toBe(true)
    })

    it('should default to false when undefined (persist migration)', () => {
      const store = configureStore({
        reducer: { settings: settingsReducer },
        preloadedState: {
          settings: {
            ...initialState,
            dataCollectionConsented: undefined as unknown as boolean,
          },
        },
      })
      const state = store.getState() as RootState
      expect(selectDataCollectionConsented(state)).toBe(false)
    })
  })
})
