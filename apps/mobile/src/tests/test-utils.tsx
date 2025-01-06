import { render as nativeRender, renderHook } from '@testing-library/react-native'
import { SafeThemeProvider } from '@/src/theme/provider/safeTheme'
import { Provider } from 'react-redux'
import { makeStore, rootReducer } from '../store'
import { PortalProvider } from 'tamagui'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { configureStore } from '@reduxjs/toolkit'

export type RootState = ReturnType<typeof rootReducer>
type getProvidersArgs = (initialStoreState?: Partial<RootState>) => React.FC<{ children: React.ReactNode }>

const getProviders: getProvidersArgs = (initialStoreState) =>
  function ProviderComponent({ children }: { children: React.ReactNode }) {
    const store = initialStoreState
      ? configureStore({
          reducer: rootReducer,
          preloadedState: initialStoreState,
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

function customRenderHook<Result, Props>(render: (initialProps: Props) => Result) {
  const wrapper = getProviders()

  return renderHook(render, { wrapper })
}

// re-export everything
export * from '@testing-library/react-native'

// override render method
export { customRender as render }
export { customRenderHook as renderHook }
