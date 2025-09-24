import { render as nativeRender, renderHook } from '@testing-library/react-native'
import { SafeThemeProvider } from '@/src/theme/provider/safeTheme'
import { Provider } from 'react-redux'
import { rootReducer } from '../store'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { web3API } from '@/src/store/signersBalance'
import type { SettingsState } from '@/src/store/settingsSlice'

export type RootState = ReturnType<typeof rootReducer>
type getProvidersArgs = (initialStoreState?: Partial<RootState>) => React.FC<{ children: React.ReactNode }>

const defaultSettings: SettingsState = {
  onboardingVersionSeen: '',
  themePreference: 'light',
  currency: 'usd',
  env: {
    rpc: {},
    tenderly: {
      url: '',
      accessToken: '',
    },
  },
}

const getProviders: getProvidersArgs = (initialStoreState) =>
  function ProviderComponent({ children }: { children: React.ReactNode }) {
    // Always inject default settings to ensure themes work properly
    const storeWithDefaults = {
      ...initialStoreState,
      settings: {
        ...defaultSettings,
        ...(initialStoreState?.settings || {}),
      },
    } as Partial<RootState>

    // Always use configured store with defaults to ensure consistent test environment
    const store = configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }).concat(cgwClient.middleware, web3API.middleware),
      preloadedState: storeWithDefaults,
    })

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
    initialStore?: Partial<RootState>
    wrapper?: React.ComponentType<{ children: React.ReactNode }>
  } = {},
) => {
  const Wrapper = getProviders(initialStore)

  function WrapperWithCustom({ children }: { children: React.ReactNode }) {
    return <Wrapper>{CustomWrapper ? <CustomWrapper>{children}</CustomWrapper> : children}</Wrapper>
  }

  return nativeRender(ui, { wrapper: WrapperWithCustom })
}

function customRenderHook<Result, Props>(render: (initialProps: Props) => Result, initialStore?: Partial<RootState>) {
  let storeInstance: ReturnType<typeof configureStore> | null = null

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    // Always inject default settings to ensure themes work properly
    const storeWithDefaults = {
      ...initialStore,
      settings: {
        ...defaultSettings,
        ...(initialStore?.settings || {}),
      },
    } as Partial<RootState>

    // Create store instance for this specific test
    storeInstance = configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }).concat(cgwClient.middleware, web3API.middleware),
      preloadedState: storeWithDefaults,
    })

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

// re-export everything
export * from '@testing-library/react-native'

// override render method
export { customRender as render }
export { customRenderHook as renderHook }
