import { render as nativeRender, renderHook } from '@testing-library/react-native'
import { SafeThemeProvider } from '@/src/theme/provider/safeTheme'
import { Provider } from 'react-redux'
import { makeStore, rootReducer } from '../store'
import { PortalProvider } from 'tamagui'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { web3API } from '@/src/store/signersBalance'
import type { SettingsState } from '@/src/store/settingsSlice'

export type RootState = ReturnType<typeof rootReducer>
type getProvidersArgs = (initialStoreState?: Partial<RootState>) => React.FC<{ children: React.ReactNode }>

// Default settings slice for tests
const defaultSettings: SettingsState = {
  onboardingVersionSeen: '',
  themePreference: 'auto',
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
    // Inject default settings if not provided
    const storeWithDefaults = initialStoreState
      ? ({
          ...initialStoreState,
          settings: {
            ...defaultSettings,
            ...(initialStoreState.settings || {}),
          },
        } as Partial<RootState>)
      : undefined
    const store = storeWithDefaults
      ? configureStore({
          reducer: rootReducer,
          middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
              serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
              },
            }).concat(cgwClient.middleware, web3API.middleware),
          preloadedState: storeWithDefaults,
        })
      : makeStore()

    return (
      <BottomSheetModalProvider>
        <PortalProvider shouldAddRootHost>
          <Provider store={store}>
            <SafeThemeProvider>{children}</SafeThemeProvider>
          </Provider>
        </PortalProvider>
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
  const wrapper = getProviders(initialStore)

  return renderHook(render, { wrapper })
}

// re-export everything
export * from '@testing-library/react-native'

// override render method
export { customRender as render }
export { customRenderHook as renderHook }
