import type { RenderHookOptions } from '@testing-library/react'
import { render, renderHook } from '@testing-library/react'
import type { NextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import type { Theme } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material/styles'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import { type RootState, makeStore, useHydrateStore } from '@/store'
import * as web3 from '@/hooks/wallets/web3'
import { type JsonRpcProvider, AbiCoder } from 'ethers'
import { id } from 'ethers'
import { Provider } from 'react-redux'
import { checksumAddress } from '@/utils/addresses'
import { faker } from '@faker-js/faker'
import { userEvent } from '@testing-library/user-event'

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

type MockCallImplementation = {
  signature: string
  returnType: string
  returnValue: unknown
}

/**
 * Creates a getWeb3 spy which returns a Web3Provider with a mocked `call` and `resolveName` function.
 *
 * @param callImplementations list of supported function calls and the mocked return value. i.e.
 * ```
 * [{
 *   signature: "balanceOf(address)",
 *   returnType: "uint256",
 *   returnValue: "200"
 * }]
 * ```
 * @param resolveName mock ens resolveName implementation
 * @returns web3provider jest spy
 */
const mockWeb3Provider = (
  callImplementations: MockCallImplementation[],
  resolveName?: (name: string) => string,
): JsonRpcProvider => {
  const mockWeb3ReadOnly = {
    call: jest.fn((tx: { data: string; to: string }) => {
      {
        const matchedImplementation = callImplementations.find((implementation) => {
          return tx.data.startsWith(id(implementation.signature).slice(0, 10))
        })

        if (!matchedImplementation) {
          throw new Error(`No matcher for call data: ${tx.data}`)
        }

        return AbiCoder.defaultAbiCoder().encode(
          [matchedImplementation.returnType],
          [matchedImplementation.returnValue],
        )
      }
    }),
    estimateGas: jest.fn(() => {
      return Promise.resolve(50_000n)
    }),
    _isProvider: true,
    resolveName,
  } as unknown as JsonRpcProvider
  jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(mockWeb3ReadOnly)
  return mockWeb3ReadOnly
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

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }
export { customRenderHook as renderHook }
export { mockWeb3Provider }
