import type { RenderHookOptions } from '@testing-library/react'
import { render, renderHook } from '@testing-library/react'
import type { NextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import type { Theme } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material/styles'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import { type RootState, makeStore, useHydrateStore } from '@/store'
import * as web3 from '@/hooks/wallets/web3'
import { Provider } from 'react-redux'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { faker } from '@faker-js/faker'
import { userEvent } from '@testing-library/user-event'
import { createMockWeb3Provider, type MockCallImplementation } from '@safe-global/utils/tests/web3Provider'

const mockRouter = (props: Partial<NextRouter> = {}): NextRouter => ({
  asPath: '/',
  basePath: '/',
  back: jest.fn(() => Promise.resolve(true)),
  beforePopState: jest.fn(() => Promise.resolve(true)),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },

  isFallback: false,
  isLocaleDomain: true,
  isPreview: true,
  isReady: true,
  pathname: '/',
  push: jest.fn(() => Promise.resolve(true)),
  prefetch: jest.fn(() => Promise.resolve()),
  reload: jest.fn(() => Promise.resolve(true)),
  replace: jest.fn(() => Promise.resolve(true)),
  route: '/',
  query: {},
  forward: () => void 0,
  ...props,
})

// Add in any providers here if necessary:
// (ReduxProvider, ThemeProvider, etc)
const getProviders: (options: {
  routerProps?: Partial<NextRouter>
  initialReduxState?: Partial<RootState>
}) => React.JSXElementConstructor<{ children: React.ReactNode }> = ({ routerProps, initialReduxState }) =>
  function ProviderComponent({ children }) {
    const store = makeStore(initialReduxState, { skipBroadcast: true })

    useHydrateStore(store)

    return (
      <Provider store={store}>
        <RouterContext.Provider value={mockRouter(routerProps)}>
          <SafeThemeProvider mode="light">
            {(safeTheme: Theme) => <ThemeProvider theme={safeTheme}>{children}</ThemeProvider>}
          </SafeThemeProvider>
        </RouterContext.Provider>
      </Provider>
    )
  }

const customRender = (
  ui: React.ReactElement,
  options?: { routerProps?: Partial<NextRouter>; initialReduxState?: Partial<RootState> },
) => {
  const wrapper = getProviders({
    routerProps: options?.routerProps || {},
    initialReduxState: options?.initialReduxState,
  })

  return render(ui, { wrapper, ...options })
}

function customRenderHook<Result, Props>(
  render: (initialProps: Props) => Result,
  options?: RenderHookOptions<Props> & { routerProps?: Partial<NextRouter>; initialReduxState?: Partial<RootState> },
) {
  const wrapper = getProviders({
    routerProps: options?.routerProps || {},
    initialReduxState: options?.initialReduxState,
  })

  return renderHook(render, { wrapper, ...options })
}

export const fakerChecksummedAddress = () => checksumAddress(faker.finance.ethereumAddress())

// https://testing-library.com/docs/user-event/intro#writing-tests-with-userevent
export const renderWithUserEvent = (
  ui: React.ReactElement,
  options?: {
    routerProps?: Partial<NextRouter>
    initialReduxState?: Partial<RootState>
  },
) => {
  return {
    user: userEvent.setup(),
    ...customRender(ui, options),
  }
}

export const mockWeb3Provider = (
  callImplementations: MockCallImplementation[],
  resolveName?: (name: string) => string,
  chainId?: string,
) => {
  const web3Provider = createMockWeb3Provider(callImplementations, resolveName, chainId)
  jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(web3Provider)
  jest.spyOn(web3, 'getWeb3ReadOnly').mockReturnValue(web3Provider)
  return web3Provider
}
// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }
export { customRenderHook as renderHook }
