import { render } from '@testing-library/react'
import type { NextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import type { Theme } from '@mui/material/styles'
import { ThemeProvider } from '@mui/material/styles'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import { type RootState, makeStore, useHydrateStore, setStoreInstance } from '@/store'
import { Provider } from 'react-redux'
import type { RequestHandler } from 'msw'
import { safeFixtures } from '@safe-global/test/msw/fixtures'
import type { FixtureScenario } from '@safe-global/test/msw/fixtures'
import { createInitialState } from '@/stories/mocks/defaults'
import { server } from '@/tests/server'

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

const getProviders: (options: {
  routerProps?: Partial<NextRouter>
  initialReduxState?: Partial<RootState>
}) => React.JSXElementConstructor<{ children: React.ReactNode }> = ({ routerProps, initialReduxState }) =>
  function ProviderComponent({ children }) {
    const store = makeStore(initialReduxState, { skipBroadcast: true })
    setStoreInstance(store)
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

export interface RenderWithScenarioOptions {
  routerProps?: Partial<NextRouter>
  /** Redux store overrides merged on top of the fixture-derived initial state */
  storeOverrides?: Partial<RootState>
  /**
   * Extra MSW handlers registered via server.use() for this render.
   * They are automatically reset by the global afterEach handler in jest.setup.js.
   */
  handlers?: RequestHandler[]
}

/**
 * Renders a component with a Redux store pre-populated from a fixture scenario
 * and any additional MSW handlers registered on the global test server.
 *
 * This bridges the Storybook and Jest mock ecosystems: the same fixture data
 * used in stories is available in unit tests without managing a separate server.
 *
 * Import from '@/tests/scenario-utils' (not '@/tests/test-utils') to avoid
 * polluting every test's module graph with fixture/store dependencies.
 *
 * @example
 * import { renderWithScenario } from '@/tests/scenario-utils'
 *
 * renderWithScenario(<MyComponent />, 'efSafe')
 *
 * @example
 * renderWithScenario(<MyComponent />, 'efSafe', {
 *   handlers: [http.get(/\/v1\/chains/, () => HttpResponse.error())],
 * })
 *
 * @example
 * renderWithScenario(<MyComponent />, 'vitalik', {
 *   storeOverrides: { safeInfo: { data: { ...safeFixtures.vitalik, deployed: false } } },
 * })
 */
export function renderWithScenario(
  ui: React.ReactElement,
  scenario: FixtureScenario = 'efSafe',
  options: RenderWithScenarioOptions = {},
) {
  const { routerProps, storeOverrides, handlers } = options

  // 'empty' uses efSafe data for store initialization (always available as a static JSON import);
  // the actual "empty" behavior comes from MSW handlers returning empty responses.
  const safeData = scenario === 'empty' ? safeFixtures.efSafe : safeFixtures[scenario]

  const initialState = createInitialState({ safeData, isDarkMode: false })
  const mergedState = { ...initialState, ...storeOverrides } as Partial<RootState>

  if (handlers && handlers.length > 0) {
    server.use(...handlers)
  }

  const wrapper = getProviders({ routerProps: routerProps ?? {}, initialReduxState: mergedState })
  return render(ui, { wrapper })
}
