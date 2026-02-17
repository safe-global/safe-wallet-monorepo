import { render as nativeRender, renderHook } from '@testing-library/react-native'
import { SafeThemeProvider } from '@/src/theme/provider/safeTheme'
import { Provider } from 'react-redux'
import { rootReducer } from '../store'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { web3API } from '@/src/store/signersBalance'
import type { SettingsState } from '@/src/store/settingsSlice'
import { TOKEN_LISTS } from '@/src/store/settingsSlice'
import type { RootState, AppDispatch } from '../store'

export type TestStore = EnhancedStore<RootState> & {
  dispatch: AppDispatch
}
export type TestStoreState = Partial<Omit<RootState, 'settings'>> & {
  settings?: Partial<SettingsState>
}
type getProvidersArgs = (initialStoreState?: TestStoreState) => React.FC<{ children: React.ReactNode }>

const defaultSettings: SettingsState = {
  onboardingVersionSeen: '',
  themePreference: 'light',
  currency: 'usd',
  tokenList: TOKEN_LISTS.TRUSTED,
  hideDust: true,
  env: {
    rpc: {},
    tenderly: {
      url: '',
      accessToken: '',
    },
  },
}

const createTestStore = (preloadedState?: TestStoreState): TestStore => {
  const storeWithDefaults = {
    ...preloadedState,
    settings: {
      ...defaultSettings,
      ...(preloadedState?.settings || {}),
    },
  } as Partial<RootState>

  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(cgwClient.middleware, web3API.middleware),
    preloadedState: storeWithDefaults,
  }) as TestStore
}

const getProviders: getProvidersArgs = (initialStoreState) =>
  function ProviderComponent({ children }: { children: React.ReactNode }) {
    const store = createTestStore(initialStoreState)

    return (
      <BottomSheetModalProvider>
        <Provider store={store}>
          <SafeThemeProvider>{children}</SafeThemeProvider>
        </Provider>
      </BottomSheetModalProvider>
    )
  }

const customRender = (
  ui: React.ReactElement,
  {
    initialStore,
    wrapper: CustomWrapper,
  }: {
    initialStore?: TestStoreState
    wrapper?: React.ComponentType<{ children: React.ReactNode }>
  } = {},
) => {
  const Wrapper = getProviders(initialStore)

  function WrapperWithCustom({ children }: { children: React.ReactNode }) {
    return <Wrapper>{CustomWrapper ? <CustomWrapper>{children}</CustomWrapper> : children}</Wrapper>
  }

  return nativeRender(ui, { wrapper: WrapperWithCustom })
}

function customRenderHook<Result, Props>(render: (initialProps: Props) => Result, initialStore?: TestStoreState) {
  let storeInstance: TestStore | null = null

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    storeInstance = createTestStore(initialStore)

    return (
      <BottomSheetModalProvider>
        <Provider store={storeInstance}>
          <SafeThemeProvider>{children}</SafeThemeProvider>
        </Provider>
      </BottomSheetModalProvider>
    )
  }

  const result = renderHook(render, { wrapper })

  if (!storeInstance) {
    throw new Error('Store was not initialized properly')
  }

  return {
    ...result,
    store: storeInstance,
  }
}

function renderHookWithStore<Result, Props>(render: (initialProps: Props) => Result, store: TestStore) {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <BottomSheetModalProvider>
        <Provider store={store}>
          <SafeThemeProvider>{children}</SafeThemeProvider>
        </Provider>
      </BottomSheetModalProvider>
    )
  }

  const result = renderHook(render, { wrapper })

  return {
    ...result,
    store,
  }
}

function renderWithStore(
  ui: React.ReactElement,
  store: TestStore,
  options?: {
    wrapper?: React.ComponentType<{ children: React.ReactNode }>
  },
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <BottomSheetModalProvider>
        <Provider store={store}>
          <SafeThemeProvider>
            {options?.wrapper ? <options.wrapper>{children}</options.wrapper> : children}
          </SafeThemeProvider>
        </Provider>
      </BottomSheetModalProvider>
    )
  }

  return nativeRender(ui, { wrapper })
}

// re-export everything
export * from '@testing-library/react-native'

// override render method
export { customRender as render }
export { customRenderHook as renderHook }
export { renderHookWithStore }
export { renderWithStore }
export { createTestStore }
export type { RootState }
