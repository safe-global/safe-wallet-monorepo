import { renderHook } from '@/tests/test-utils'
import { useSessionExpiryGuard } from '../useSessionExpiryGuard'
import type { RootState } from '@/store'

const mockSessionExpiredAction = { type: 'sessionExpired' }
const mockSessionExpired = jest.fn(() => mockSessionExpiredAction)
jest.mock('@/store/sessionExpired', () => ({
  sessionExpired: () => mockSessionExpired(),
}))

const routerEvents = {
  on: jest.fn(),
  off: jest.fn(),
}

jest.mock('next/router', () => ({
  useRouter: () => ({ events: routerEvents }),
}))

const buildState = (sessionExpiresAt: number | null): Partial<RootState> =>
  ({
    auth: { sessionExpiresAt, lastUsedSpace: null, isStoreHydrated: true, isOidcLoginPending: false },
  }) as Partial<RootState>

describe('useSessionExpiryGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2026-05-05T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const getRouteChangeHandler = (): (() => void) | undefined => {
    const call = routerEvents.on.mock.calls.find(([event]) => event === 'routeChangeStart')
    return call?.[1] as (() => void) | undefined
  }

  it('dispatches sessionExpired on mount when sessionExpiresAt is in the past', () => {
    renderHook(() => useSessionExpiryGuard(), {
      initialReduxState: buildState(Date.now() - 1_000),
    })

    expect(mockSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('does not dispatch on mount when sessionExpiresAt is in the future', () => {
    renderHook(() => useSessionExpiryGuard(), {
      initialReduxState: buildState(Date.now() + 60_000),
    })

    expect(mockSessionExpired).not.toHaveBeenCalled()
  })

  it('does not dispatch on mount when sessionExpiresAt is null (logged out)', () => {
    renderHook(() => useSessionExpiryGuard(), {
      initialReduxState: buildState(null),
    })

    expect(mockSessionExpired).not.toHaveBeenCalled()
  })

  it('dispatches when routeChangeStart fires after the session has expired', () => {
    renderHook(() => useSessionExpiryGuard(), {
      initialReduxState: buildState(Date.now() + 60_000),
    })

    // No dispatch yet — session is valid.
    expect(mockSessionExpired).not.toHaveBeenCalled()

    // Move past the expiry window before triggering navigation.
    jest.advanceTimersByTime(120_000)

    const handler = getRouteChangeHandler()
    expect(handler).toBeDefined()
    handler?.()

    expect(mockSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('does not dispatch on routeChangeStart when sessionExpiresAt is still in the future', () => {
    renderHook(() => useSessionExpiryGuard(), {
      initialReduxState: buildState(Date.now() + 60_000),
    })

    const handler = getRouteChangeHandler()
    handler?.()

    expect(mockSessionExpired).not.toHaveBeenCalled()
  })

  it('cleans up the routeChangeStart listener on unmount', () => {
    const { unmount } = renderHook(() => useSessionExpiryGuard(), {
      initialReduxState: buildState(Date.now() + 60_000),
    })

    expect(routerEvents.on).toHaveBeenCalledWith('routeChangeStart', expect.any(Function))
    const handler = routerEvents.on.mock.calls[0][1]

    unmount()

    expect(routerEvents.off).toHaveBeenCalledWith('routeChangeStart', handler)
  })
})
