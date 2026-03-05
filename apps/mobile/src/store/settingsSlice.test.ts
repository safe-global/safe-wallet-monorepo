import { configureStore } from '@reduxjs/toolkit'
import settingsReducer, {
  selectHideDust,
  setHideDust,
  setTokenList,
  selectTokenList,
  TOKEN_LISTS,
  SettingsState,
} from './settingsSlice'
import type { RootState } from '.'

const createMockStore = (initialState?: Partial<SettingsState>) => {
  return configureStore({
    reducer: {
      settings: settingsReducer,
    },
    preloadedState: {
      settings: {
        onboardingVersionSeen: '',
        themePreference: 'auto' as SettingsState['themePreference'],
        currency: 'usd',
        tokenList: TOKEN_LISTS.TRUSTED,
        hideDust: true,
        env: { rpc: {}, tenderly: { url: '', accessToken: '' } },
        ...initialState,
      },
    },
  })
}

describe('settingsSlice - hideDust', () => {
  it('should default hideDust to true', () => {
    const store = createMockStore()
    const state = store.getState() as unknown as RootState
    expect(selectHideDust(state)).toBe(true)
  })

  it('should set hideDust to false', () => {
    const store = createMockStore()
    store.dispatch(setHideDust(false))
    const state = store.getState() as unknown as RootState
    expect(selectHideDust(state)).toBe(false)
  })

  it('should set hideDust to true', () => {
    const store = createMockStore({ hideDust: false })
    store.dispatch(setHideDust(true))
    const state = store.getState() as unknown as RootState
    expect(selectHideDust(state)).toBe(true)
  })

  it('should default to true when hideDust is undefined (persist migration)', () => {
    const store = createMockStore({ hideDust: undefined as unknown as boolean })
    const state = store.getState() as unknown as RootState
    expect(selectHideDust(state)).toBe(true)
  })
})

describe('settingsSlice - tokenList', () => {
  it('should default tokenList to TRUSTED', () => {
    const store = createMockStore()
    const state = store.getState() as unknown as RootState
    expect(selectTokenList(state)).toBe(TOKEN_LISTS.TRUSTED)
  })

  it('should set tokenList to ALL', () => {
    const store = createMockStore()
    store.dispatch(setTokenList(TOKEN_LISTS.ALL))
    const state = store.getState() as unknown as RootState
    expect(selectTokenList(state)).toBe(TOKEN_LISTS.ALL)
  })
})
