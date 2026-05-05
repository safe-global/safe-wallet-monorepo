import { AppRoutes } from '@/config/routes'

// Capture the registered hook so we can fire it like the real cgwClient would.
let registeredHook: ((response: Response, url: string) => void | Promise<void>) | undefined

jest.mock('@safe-global/store/gateway/cgwClient', () => {
  const CREDENTIAL_ROUTES = [/\/v1\/users/, /\/v1\/spaces/, /\/v1\/auth/]
  return {
    addHandleResponseHook: (fn: typeof registeredHook) => {
      registeredHook = fn
    },
    isCredentialRoute: (url: string) => CREDENTIAL_ROUTES.some((r) => r.test(url)),
  }
})

jest.mock('next/router', () => ({
  __esModule: true,
  default: { replace: jest.fn() },
}))

const dispatched: Array<{ type: string; payload?: unknown }> = []
let mockState: { auth: { sessionExpiresAt: number | null } } = { auth: { sessionExpiresAt: null } }

jest.mock('@/store', () => ({
  getStoreInstance: () => ({
    dispatch: (action: unknown) => {
      // showNotification returns a thunk — execute it so the enqueueNotification action lands.
      if (typeof action === 'function') {
        return (action as (d: typeof dispatch, gs: typeof getState) => unknown)(dispatch, getState)
      }
      dispatched.push(action as { type: string; payload?: unknown })
      // Mirror the real reducer effect for setUnauthenticated.
      if ((action as { type: string }).type === 'auth/setUnauthenticated') {
        mockState = { auth: { sessionExpiresAt: null } }
      }
      return action
    },
    getState: () => mockState,
  }),
}))

const dispatch = (action: unknown) => {
  if (typeof action === 'function') {
    return (action as (d: typeof dispatch, gs: typeof getState) => unknown)(dispatch, getState)
  }
  dispatched.push(action as { type: string; payload?: unknown })
  if ((action as { type: string }).type === 'auth/setUnauthenticated') {
    mockState = { auth: { sessionExpiresAt: null } }
  }
  return action
}
const getState = () => mockState

// We deliberately do NOT mock @/store/sessionExpired or @/store/notificationsSlice —
// this test exercises the real thunk chain end-to-end.

jest.mock('@/store/authSlice', () => ({
  setUnauthenticated: () => ({ type: 'auth/setUnauthenticated' }),
}))

const makeResponse = (status: number): Response => ({ status }) as Response

describe('sessionExpiry integration — 403 on credentialed routes triggers full redirect + toast chain', () => {
  let routerReplace: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    registeredHook = undefined
    dispatched.length = 0
    mockState = { auth: { sessionExpiresAt: Date.now() + 60_000 } }
    // After resetModules, re-acquire the mocked router so we read the post-reset jest.fn().
    routerReplace = require('next/router').default.replace as jest.Mock
    routerReplace.mockClear()
  })

  const initAndFire = async (status: number, url: string) => {
    const { initializeSessionExpiry } = require('../sessionExpiryInit')
    initializeSessionExpiry()
    expect(registeredHook).toBeDefined()
    await registeredHook!(makeResponse(status), url)
  }

  it('dispatches the full chain (setUnauthenticated + enqueueNotification + Router.replace) on 403 to /v1/spaces/*', async () => {
    await initAndFire(403, '/v1/spaces/123/safes')

    // setUnauthenticated dispatched first
    expect(dispatched.find((a) => a.type === 'auth/setUnauthenticated')).toBeDefined()

    // showNotification thunk ran → enqueueNotification action with our error message + groupKey landed
    const notification = dispatched.find((a) => a.type === 'notifications/enqueueNotification') as
      | { type: string; payload: { message: string; variant: string; groupKey: string } }
      | undefined
    expect(notification).toBeDefined()
    expect(notification?.payload.message).toMatch(/session has expired.*sign in/i)
    expect(notification?.payload.variant).toBe('error')
    expect(notification?.payload.groupKey).toBe('session-expired')

    // Router.replace was called with welcome.spaces
    expect(routerReplace).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
  })

  it('does not redirect on 403 to /v1/auth/me (excluded probe route)', async () => {
    await initAndFire(403, '/v1/auth/me')

    expect(dispatched).toHaveLength(0)
    expect(routerReplace).not.toHaveBeenCalled()
  })

  it('does not redirect on 403 to a non-credentialed route (e.g. /v1/chains/...)', async () => {
    await initAndFire(403, '/v1/chains/1/safes/0xabc')

    expect(dispatched).toHaveLength(0)
    expect(routerReplace).not.toHaveBeenCalled()
  })

  it('does not redirect on a 200 response to a credentialed route', async () => {
    await initAndFire(200, '/v1/spaces/123/safes')

    expect(dispatched).toHaveLength(0)
    expect(routerReplace).not.toHaveBeenCalled()
  })

  it('redirects on 403 to /v1/users/* (also a credentialed route)', async () => {
    await initAndFire(403, '/v1/users/me')

    expect(dispatched.find((a) => a.type === 'auth/setUnauthenticated')).toBeDefined()
    expect(routerReplace).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
  })
})
