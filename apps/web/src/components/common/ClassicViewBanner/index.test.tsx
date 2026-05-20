import { act, render, screen, fireEvent } from '@/tests/test-utils'
import ClassicViewBanner from '@/components/common/ClassicViewBanner'
import { enableClassicView, disableClassicView } from '@/hooks/useClassicView'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { RootState } from '@/store'

// See useClassicView.test.ts — jest.mock keeps hook ordering stable across
// the re-renders triggered by useSyncExternalStore.
let mockChainData: Chain | undefined
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useChain: jest.fn(() => mockChainData),
  default: jest.fn(() => ({ configs: [], loading: false })),
  useCurrentChain: jest.fn(() => undefined),
}))

const setMockChain = (chain: Chain | undefined) => {
  mockChainData = chain
}

const mockChain = (features: FEATURES[]): Chain =>
  ({ chainId: String(DEFAULT_CHAIN_ID), features: features as unknown as string[] }) as Chain

const signedInState: Partial<RootState> = {
  auth: {
    sessionExpiresAt: Date.now() + 60_000,
    lastUsedSpace: null,
    isStoreHydrated: true,
    isOidcLoginPending: false,
  },
} as Partial<RootState>

describe('ClassicViewBanner', () => {
  beforeEach(() => {
    setMockChain(mockChain([]))
    sessionStorage.clear()
    localStorage.clear()
  })

  afterEach(() => {
    disableClassicView()
  })

  it('renders nothing when classic view is not active', () => {
    render(<ClassicViewBanner />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders the deprecation message and a Log in link when classic view is active and the user is signed out', () => {
    act(() => {
      enableClassicView()
    })

    render(<ClassicViewBanner />)

    expect(screen.getByRole('alert')).toHaveTextContent('Classic view will be deprecated in 1 month')
    expect(screen.getByTestId('classic-view-banner-login')).toBeInTheDocument()
  })

  it('renders nothing when the user is signed in, even while opted into classic view', () => {
    act(() => {
      enableClassicView()
    })

    render(<ClassicViewBanner />, { initialReduxState: signedInState })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders nothing when the CLASSIC_VIEW_DISABLED chain flag is set, even if the session is opted in', () => {
    setMockChain(mockChain([FEATURES.CLASSIC_VIEW_DISABLED]))
    act(() => {
      enableClassicView()
    })

    render(<ClassicViewBanner />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('clears the classic-view opt-in and navigates to /welcome/spaces when the login link is clicked', () => {
    act(() => {
      enableClassicView()
    })

    const push = jest.fn()
    render(<ClassicViewBanner />, { routerProps: { push } })

    expect(screen.getByRole('alert')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('classic-view-banner-login'))

    expect(push).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
    // The component subscribes to the opt-in store, so clearing the opt-in
    // re-renders it as hidden in-place — no second render needed.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
