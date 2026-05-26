import { useStore } from 'react-redux'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import type { AppStore, RootState } from '@/store'
import {
  useSessionExpiryGuard,
  SESSION_EXPIRED_GROUP_KEY,
  SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_SIGN_IN_LABEL,
} from '../useSessionExpiryGuard'
import { setAuthenticated } from '@/store/authSlice'
import { LOGGING_OUT_KEY } from '@/hooks/useLogoutCallback'

const mockUnwrap = jest.fn()
const mockUnsubscribe = jest.fn()
const mockInitiate = jest.fn()

// Real RTK Query's `endpoint.initiate()` returns a thunk; dispatching it returns a
// QueryActionCreatorResult with .unwrap()/.unsubscribe(). We mirror that shape:
// initiate() → thunk fn → dispatch invokes it → resolves to { unwrap, unsubscribe }.
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  cgwApi: {
    endpoints: {
      authGetMeV1: {
        initiate: () => mockInitiate(),
      },
    },
  },
}))

const buildState = (sessionExpiresAt: number | null, isStoreHydrated = true): Partial<RootState> =>
  ({
    auth: {
      sessionExpiresAt,
      lastUsedSpace: null,
      isStoreHydrated,
      isOidcLoginPending: false,
    },
  }) as Partial<RootState>

const findNotification = (store: AppStore) =>
  store.getState().notifications.find((n) => n.groupKey === SESSION_EXPIRED_GROUP_KEY)

const flushMicrotasks = () => act(async () => Promise.resolve())

const renderGuardWithStore = (sessionExpiresAt: number | null) => {
  let capturedStore: AppStore | undefined
  const result = renderHook(
    () => {
      capturedStore = useStore() as AppStore
      useSessionExpiryGuard()
    },
    { initialReduxState: buildState(sessionExpiresAt) },
  )
  if (!capturedStore) throw new Error('store not captured')
  return { ...result, store: capturedStore }
}

describe('useSessionExpiryGuard', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-07T12:00:00Z'))
    mockUnwrap.mockReset()
    mockUnsubscribe.mockReset()
    mockInitiate.mockReset()
    // Default: dispatching the thunk yields the QueryActionCreatorResult shape.
    mockInitiate.mockImplementation(() => () => ({ unwrap: mockUnwrap, unsubscribe: mockUnsubscribe }))
    sessionStorage.clear()
    // Load-bearing: the auth slice is persisted (apps/web/src/store/index.ts
    // persistedSlices), so a prior test's dispatched setUnauthenticated would
    // be replayed into this test's store via useHydrateStore's HYDRATE_ACTION
    // and clobber initialReduxState.auth.sessionExpiresAt. Do not remove.
    localStorage.clear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('does nothing when the user is not signed in (sessionExpiresAt is null)', async () => {
    const { store } = renderGuardWithStore(null)
    await flushMicrotasks()

    expect(mockInitiate).not.toHaveBeenCalled()
    expect(findNotification(store)).toBeUndefined()
  })

  it('clears auth and shows a toast when sessionExpiresAt has already passed — without firing /v1/auth/me', async () => {
    const { store } = renderGuardWithStore(Date.now() - 1_000)
    await flushMicrotasks()

    expect(mockInitiate).not.toHaveBeenCalled()
    expect(store.getState().auth.sessionExpiresAt).toBeNull()
    expect(findNotification(store)).toMatchObject({
      message: SESSION_EXPIRED_MESSAGE,
      variant: 'error',
      groupKey: SESSION_EXPIRED_GROUP_KEY,
    })
  })

  it('fires exactly one /v1/auth/me probe when sessionExpiresAt is in the future', async () => {
    mockUnwrap.mockResolvedValue({ id: 'user-1' })

    const { rerender } = renderGuardWithStore(Date.now() + 60_000)
    await flushMicrotasks()
    rerender()
    rerender()
    await flushMicrotasks()

    expect(mockInitiate).toHaveBeenCalledTimes(1)
  })

  it('keeps Redux auth state when /v1/auth/me returns 200', async () => {
    mockUnwrap.mockResolvedValue({ id: 'user-1' })
    const expiresAt = Date.now() + 60_000

    const { store } = renderGuardWithStore(expiresAt)
    await flushMicrotasks()

    expect(store.getState().auth.sessionExpiresAt).toBe(expiresAt)
    expect(findNotification(store)).toBeUndefined()
  })

  it('clears auth and shows a toast when /v1/auth/me returns 403', async () => {
    mockUnwrap.mockRejectedValue({ status: 403, data: 'Forbidden' })

    const { store } = renderGuardWithStore(Date.now() + 60_000)
    await flushMicrotasks()

    expect(store.getState().auth.sessionExpiresAt).toBeNull()
    expect(findNotification(store)).toMatchObject({
      message: SESSION_EXPIRED_MESSAGE,
      variant: 'error',
      groupKey: SESSION_EXPIRED_GROUP_KEY,
    })
  })

  it('leaves auth state untouched on transient errors but still schedules the local-expiry timer', async () => {
    mockUnwrap.mockRejectedValue({ status: 500, data: 'oops' })
    const expiresAt = Date.now() + 60_000

    const { store } = renderGuardWithStore(expiresAt)
    await flushMicrotasks()

    // Immediately: no clear, no toast — we don't have proof the cookie is bad.
    expect(store.getState().auth.sessionExpiresAt).toBe(expiresAt)
    expect(findNotification(store)).toBeUndefined()

    // After local expiry passes, the timer must fire so we don't leak past expiry.
    await act(async () => {
      jest.advanceTimersByTime(60_001)
      await Promise.resolve()
    })

    expect(store.getState().auth.sessionExpiresAt).toBeNull()
    expect(findNotification(store)).toMatchObject({
      message: SESSION_EXPIRED_MESSAGE,
      groupKey: SESSION_EXPIRED_GROUP_KEY,
    })
  })

  it('schedules a timer that clears auth and toasts when the session expires mid-tab', async () => {
    mockUnwrap.mockResolvedValue({ id: 'user-1' })
    const expiresAt = Date.now() + 60_000

    const { store } = renderGuardWithStore(expiresAt)
    await flushMicrotasks()

    expect(store.getState().auth.sessionExpiresAt).toBe(expiresAt)

    await act(async () => {
      jest.advanceTimersByTime(60_001)
      await Promise.resolve()
    })

    expect(store.getState().auth.sessionExpiresAt).toBeNull()
    expect(findNotification(store)).toMatchObject({
      message: SESSION_EXPIRED_MESSAGE,
      groupKey: SESSION_EXPIRED_GROUP_KEY,
    })
  })

  it('suppresses the /me probe but still arms the local-expiry timer when LOGGING_OUT_KEY is set', async () => {
    sessionStorage.setItem(LOGGING_OUT_KEY, '1')

    const { store } = renderGuardWithStore(Date.now() + 60_000)
    await flushMicrotasks()

    // No probe — useLogoutCallback owns /me during this flow.
    expect(mockInitiate).not.toHaveBeenCalled()
    expect(findNotification(store)).toBeUndefined()

    // …but the local timer must still fire so a flow that finishes silently
    // (callback crashes, dispatch never lands) doesn't leave sessionExpiresAt
    // unenforced.
    await act(async () => {
      jest.advanceTimersByTime(60_001)
      await Promise.resolve()
    })

    expect(store.getState().auth.sessionExpiresAt).toBeNull()
    expect(findNotification(store)).toMatchObject({
      message: SESSION_EXPIRED_MESSAGE,
      groupKey: SESSION_EXPIRED_GROUP_KEY,
    })
  })

  it('suppresses the /me probe but still arms the local-expiry timer when oidc_auth_pending is set', async () => {
    sessionStorage.setItem('oidc_auth_pending', '1')

    const { store } = renderGuardWithStore(Date.now() + 60_000)
    await flushMicrotasks()

    expect(mockInitiate).not.toHaveBeenCalled()
    expect(findNotification(store)).toBeUndefined()

    await act(async () => {
      jest.advanceTimersByTime(60_001)
      await Promise.resolve()
    })

    expect(store.getState().auth.sessionExpiresAt).toBeNull()
    expect(findNotification(store)).toMatchObject({
      message: SESSION_EXPIRED_MESSAGE,
      groupKey: SESSION_EXPIRED_GROUP_KEY,
    })
  })

  it('clears auth at sessionExpiresAt even if the /me probe is still pending', async () => {
    // Probe never resolves — simulates a slow/hung gateway.
    mockUnwrap.mockReturnValue(new Promise(() => {}))
    const expiresAt = Date.now() + 60_000

    const { store } = renderGuardWithStore(expiresAt)
    await flushMicrotasks()

    expect(mockInitiate).toHaveBeenCalledTimes(1)
    expect(store.getState().auth.sessionExpiresAt).toBe(expiresAt)

    await act(async () => {
      jest.advanceTimersByTime(60_001)
      await Promise.resolve()
    })

    expect(store.getState().auth.sessionExpiresAt).toBeNull()
    expect(findNotification(store)).toMatchObject({
      message: SESSION_EXPIRED_MESSAGE,
      groupKey: SESSION_EXPIRED_GROUP_KEY,
    })
  })

  it('does not re-fire the /me probe across re-renders that keep sessionExpiresAt unchanged', async () => {
    mockUnwrap.mockResolvedValue({ id: 'u' })

    const { rerender } = renderGuardWithStore(Date.now() + 60_000)
    await flushMicrotasks()
    rerender()
    rerender()
    await flushMicrotasks()

    expect(mockInitiate).toHaveBeenCalledTimes(1)
  })

  it('fires a fresh /me probe after the user logs out and signs back in within the same tab', async () => {
    mockUnwrap.mockResolvedValue({ id: 'u' })

    // First mount: signed in.
    const first = renderGuardWithStore(Date.now() + 60_000)
    await flushMicrotasks()
    expect(mockInitiate).toHaveBeenCalledTimes(1)
    first.unmount()

    // Second mount: same tab, signed out (preloaded null).
    const middle = renderGuardWithStore(null)
    await flushMicrotasks()
    expect(mockInitiate).toHaveBeenCalledTimes(1)
    middle.unmount()

    // Third mount: signed in again with a new expiry — a fresh probe must fire.
    renderGuardWithStore(Date.now() + 120_000)
    await flushMicrotasks()
    expect(mockInitiate).toHaveBeenCalledTimes(2)
  })

  it('dismisses a lingering session-expired toast when the user signs back in within the same tab', async () => {
    mockUnwrap.mockResolvedValue({ id: 'u' })

    // Reproduce the bug: prior expiry left a toast in the store, then the user
    // signs in again. The toast must not hang on screen.
    const { store } = renderGuardWithStore(Date.now() - 1_000)
    await flushMicrotasks()
    const toast = findNotification(store)
    expect(toast).toBeDefined()
    expect(toast?.isDismissed).not.toBe(true)

    await act(async () => {
      store.dispatch(setAuthenticated(Date.now() + 60_000))
      await Promise.resolve()
    })

    expect(findNotification(store)?.isDismissed).toBe(true)
  })

  it('shows a Spaces sign-in link in the toast that points at /welcome/spaces', async () => {
    const { store } = renderGuardWithStore(Date.now() - 1_000)
    await flushMicrotasks()

    expect(findNotification(store)).toMatchObject({
      message: SESSION_EXPIRED_MESSAGE,
      link: { href: '/welcome/spaces', title: SESSION_EXPIRED_SIGN_IN_LABEL },
    })
    expect(SESSION_EXPIRED_MESSAGE).toBe('Your session has expired. Please sign in to workspaces again.')
  })

  it('runs once after the store hydrates from a partial preloaded state', async () => {
    mockUnwrap.mockResolvedValue({ id: 'user-1' })

    // Mark hydration explicitly false in preloaded state; the test harness'
    // useHydrateStore flips it to true on mount.
    renderHook(() => useSessionExpiryGuard(), {
      initialReduxState: buildState(Date.now() + 60_000, false),
    })

    await waitFor(() => {
      expect(mockInitiate).toHaveBeenCalledTimes(1)
    })
  })
})
