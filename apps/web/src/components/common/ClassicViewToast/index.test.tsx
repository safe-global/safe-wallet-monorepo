import { act, render } from '@/tests/test-utils'
import ClassicViewToast, {
  CLASSIC_VIEW_TOAST_GROUP_KEY,
  CLASSIC_VIEW_TOAST_LINK_TITLE,
  CLASSIC_VIEW_TOAST_MESSAGE,
} from '@/components/common/ClassicViewToast'
import { enableClassicView, disableClassicView } from '@/hooks/useClassicView'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { showNotification, closeByGroupKey } from '@/store/notificationsSlice'
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

jest.mock('@/store/notificationsSlice', () => {
  const actual = jest.requireActual('@/store/notificationsSlice')
  return {
    ...actual,
    showNotification: jest.fn((payload: unknown) => ({ type: 'notifications/show', payload })),
    closeByGroupKey: jest.fn((payload: unknown) => ({ type: 'notifications/closeByGroupKey', payload })),
  }
})

const mockShowNotification = showNotification as unknown as jest.Mock
const mockCloseByGroupKey = closeByGroupKey as unknown as jest.Mock

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

describe('ClassicViewToast', () => {
  beforeEach(() => {
    setMockChain(mockChain([]))
    sessionStorage.clear()
    localStorage.clear()
    mockShowNotification.mockClear()
    mockCloseByGroupKey.mockClear()
  })

  afterEach(() => {
    disableClassicView()
  })

  it('does not dispatch a notification when classic view is not active', () => {
    render(<ClassicViewToast />)
    expect(mockShowNotification).not.toHaveBeenCalled()
  })

  it('dispatches the deprecation toast when classic view is active and the user is signed out', () => {
    act(() => {
      enableClassicView()
    })

    render(<ClassicViewToast />)

    expect(mockShowNotification).toHaveBeenCalledTimes(1)
    const payload = mockShowNotification.mock.calls[0][0]
    expect(payload).toMatchObject({
      message: CLASSIC_VIEW_TOAST_MESSAGE,
      variant: 'warning',
      groupKey: CLASSIC_VIEW_TOAST_GROUP_KEY,
    })
    expect(payload.link).toMatchObject({ title: CLASSIC_VIEW_TOAST_LINK_TITLE })
    expect(typeof payload.link.onClick).toBe('function')
  })

  it('does not dispatch a notification when the user is signed in, even while opted into classic view', () => {
    act(() => {
      enableClassicView()
    })

    render(<ClassicViewToast />, { initialReduxState: signedInState })

    expect(mockShowNotification).not.toHaveBeenCalled()
  })

  it('does not dispatch a notification when the CLASSIC_VIEW_DISABLED chain flag is set, even if the session is opted in', () => {
    setMockChain(mockChain([FEATURES.CLASSIC_VIEW_DISABLED]))
    act(() => {
      enableClassicView()
    })

    render(<ClassicViewToast />)

    expect(mockShowNotification).not.toHaveBeenCalled()
  })

  it('clears the classic-view opt-in, dismisses the toast, and navigates to /welcome/spaces when the toast link is clicked', () => {
    act(() => {
      enableClassicView()
    })

    const push = jest.fn()
    render(<ClassicViewToast />, { routerProps: { push } })

    expect(mockShowNotification).toHaveBeenCalledTimes(1)
    const payload = mockShowNotification.mock.calls[0][0]
    const link = payload.link as { onClick: () => void; title: string }

    act(() => {
      link.onClick()
    })

    expect(push).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
    // The component subscribes to the opt-in store; once disabled, the effect
    // re-runs and dismisses the toast via closeByGroupKey.
    expect(mockCloseByGroupKey).toHaveBeenCalledWith({ groupKey: CLASSIC_VIEW_TOAST_GROUP_KEY })
  })
})
