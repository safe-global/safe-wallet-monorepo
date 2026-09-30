import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import type { UnknownAction } from '@reduxjs/toolkit'
import { faker } from '@faker-js/faker'
import { forbiddenSessionListener } from '../forbiddenSessionListener'
import { SESSION_EXPIRED_GROUP_KEY } from '../expireSession'
import { authSlice, setAuthenticated } from '@/store/authSlice'
import { notificationsSlice } from '@/store/notificationsSlice'
import { stepUpSlice } from '@/features/oidc-auth/store'
import { ELEVATION_REQUIRED_ERROR } from '@/features/oidc-auth/utils/elevation'
import { AppRoutes } from '@/config/routes'

const mockUnwrap = jest.fn()
const mockUnsubscribe = jest.fn()
const mockInitiate = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  cgwApi: {
    endpoints: {
      authGetMeV1: {
        initiate: (...args: unknown[]) => mockInitiate(...args),
      },
    },
  },
}))

const GATEWAY = faker.internet.url({ appendSlash: false })

type RejectedOptions = {
  url?: string
  endpointName?: string
  payload?: unknown
  type?: string
}

const rejectedWithValue = ({
  url = `${GATEWAY}/v1/spaces/${faker.string.uuid()}`,
  endpointName = 'spacesGetOneV1',
  payload = { status: 403, data: 'Forbidden' },
  type = 'api/executeQuery/rejected',
}: RejectedOptions = {}) =>
  ({
    type,
    payload,
    error: { message: 'Rejected' },
    meta: {
      requestId: faker.string.alphanumeric(8),
      requestStatus: 'rejected',
      rejectedWithValue: true,
      arg: { type: 'query', endpointName, originalArgs: {} },
      baseQueryMeta: { request: { url } },
    },
  }) as UnknownAction

const createTestStore = () => {
  const listenerMiddleware = createListenerMiddleware()
  forbiddenSessionListener(listenerMiddleware as unknown as Parameters<typeof forbiddenSessionListener>[0])

  return configureStore({
    reducer: {
      [authSlice.name]: authSlice.reducer,
      [notificationsSlice.name]: notificationsSlice.reducer,
      [stepUpSlice.name]: stepUpSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  })
}

type TestStore = ReturnType<typeof createTestStore>

const signIn = (store: TestStore) => store.dispatch(setAuthenticated(Date.now() + 60_000))
const sessionOf = (store: TestStore) => store.getState().auth.sessionExpiresAt
const pendingOf = (store: TestStore) => store.getState().auth.isSessionCheckPending
const toastOf = (store: TestStore) =>
  store.getState().notifications.find((n) => n.groupKey === SESSION_EXPIRED_GROUP_KEY)

const flush = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

const setPathname = (pathname: string) => {
  window.history.replaceState({}, '', pathname)
}

describe('forbiddenSessionListener', () => {
  beforeEach(() => {
    mockUnwrap.mockReset()
    mockUnsubscribe.mockReset()
    mockInitiate.mockReset()
    mockInitiate.mockImplementation(() => () => ({ unwrap: mockUnwrap, unsubscribe: mockUnsubscribe }))
    setPathname(AppRoutes.spaces.index)
  })

  it('signs the user out and shows the expiry toast when /v1/auth/me also returns 403', async () => {
    mockUnwrap.mockRejectedValue({ status: 403, data: 'Forbidden' })
    const store = createTestStore()
    signIn(store)

    store.dispatch(rejectedWithValue())
    await flush()

    expect(mockInitiate).toHaveBeenCalledWith(undefined, { forceRefetch: true })
    expect(sessionOf(store)).toBeNull()
    expect(toastOf(store)).toBeDefined()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('keeps the session when /v1/auth/me returns 200', async () => {
    mockUnwrap.mockResolvedValue({ id: faker.number.int() })
    const store = createTestStore()
    const expiresAt = signIn(store).payload

    store.dispatch(rejectedWithValue())
    await flush()

    expect(mockInitiate).toHaveBeenCalledTimes(1)
    expect(sessionOf(store)).toBe(expiresAt)
    expect(pendingOf(store)).toBe(false)
    expect(toastOf(store)).toBeUndefined()
  })

  it('keeps the session when /v1/auth/me fails transiently', async () => {
    mockUnwrap.mockRejectedValue({ status: 500, data: 'oops' })
    const store = createTestStore()
    const expiresAt = signIn(store).payload

    store.dispatch(rejectedWithValue())
    await flush()

    expect(sessionOf(store)).toBe(expiresAt)
    expect(toastOf(store)).toBeUndefined()
  })

  it('shows no toast when the user is outside workspaces routes', async () => {
    mockUnwrap.mockRejectedValue({ status: 403, data: 'Forbidden' })
    setPathname(AppRoutes.welcome.accounts)
    const store = createTestStore()
    signIn(store)

    store.dispatch(rejectedWithValue())
    await flush()

    expect(sessionOf(store)).toBeNull()
    expect(toastOf(store)).toBeUndefined()
  })

  it('probes once for a burst of concurrent 403s', async () => {
    let rejectProbe: (error: unknown) => void = () => {}
    mockUnwrap.mockImplementation(() => new Promise((_, reject) => (rejectProbe = reject)))
    const store = createTestStore()
    signIn(store)

    store.dispatch(rejectedWithValue({ endpointName: 'spacesGetOneV1' }))
    store.dispatch(rejectedWithValue({ endpointName: 'membersGetUsersV1' }))
    store.dispatch(rejectedWithValue({ endpointName: 'spaceSafesGetV1' }))
    await flush()
    expect(pendingOf(store)).toBe(true)
    rejectProbe({ status: 403, data: 'Forbidden' })
    await flush()

    expect(mockInitiate).toHaveBeenCalledTimes(1)
    expect(sessionOf(store)).toBeNull()
    expect(pendingOf(store)).toBe(false)
  })

  it('keeps a session that was renewed while the probe was in flight', async () => {
    let rejectProbe: (error: unknown) => void = () => {}
    mockUnwrap.mockImplementation(() => new Promise((_, reject) => (rejectProbe = reject)))
    const store = createTestStore()
    signIn(store)

    store.dispatch(rejectedWithValue())
    await flush()
    const renewedExpiry = store.dispatch(setAuthenticated(Date.now() + 120_000)).payload
    rejectProbe({ status: 403, data: 'Forbidden' })
    await flush()

    expect(sessionOf(store)).toBe(renewedExpiry)
    expect(toastOf(store)).toBeUndefined()
  })

  it('probes again for a 403 that arrives after the previous probe settled', async () => {
    mockUnwrap.mockResolvedValue({ id: faker.number.int() })
    const store = createTestStore()
    signIn(store)

    store.dispatch(rejectedWithValue())
    await flush()
    store.dispatch(rejectedWithValue())
    await flush()

    expect(mockInitiate).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['the user is already signed out', { signedIn: false, options: {} }],
    ['the status is not 403', { signedIn: true, options: { payload: { status: 404, data: 'Not found' } } }],
    [
      'the 403 asks for step-up verification',
      { signedIn: true, options: { payload: { status: 403, data: { message: ELEVATION_REQUIRED_ERROR } } } },
    ],
    ['the route is not credentialed', { signedIn: true, options: { url: `${GATEWAY}/v1/chains/1/relay/0xabc` } }],
    ['the rejection comes from /v1/auth/me itself', { signedIn: true, options: { endpointName: 'authGetMeV1' } }],
    ['the action is not a CGW action', { signedIn: true, options: { type: 'gatewayApi/executeQuery/rejected' } }],
  ])('does not probe when %s', async (_, { signedIn, options }) => {
    const store = createTestStore()
    if (signedIn) signIn(store)

    store.dispatch(rejectedWithValue(options))
    await flush()

    expect(mockInitiate).not.toHaveBeenCalled()
    expect(toastOf(store)).toBeUndefined()
  })
})
