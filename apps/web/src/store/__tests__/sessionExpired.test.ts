import Router from 'next/router'
import type { AppDispatch, RootState } from '@/store'
import { sessionExpired, SESSION_EXPIRED_GROUP_KEY } from '@/store/sessionExpired'
import { AppRoutes } from '@/config/routes'

jest.mock('next/router', () => ({
  __esModule: true,
  default: { replace: jest.fn() },
}))

jest.mock('@/store/authSlice', () => ({
  setUnauthenticated: () => ({ type: 'auth/setUnauthenticated' }),
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

const makeState = (sessionExpiresAt: number | null): RootState =>
  ({ auth: { sessionExpiresAt } }) as unknown as RootState

const setup = (state: RootState) => {
  const dispatch = jest.fn((action) => action) as unknown as AppDispatch & jest.Mock
  const getState = jest.fn(() => state)
  return { dispatch, getState }
}

describe('sessionExpired', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('clears auth, queues a session-expired toast, and replaces to welcome.spaces when authenticated', () => {
    const { dispatch, getState } = setup(makeState(Date.now() + 60_000))

    sessionExpired()(dispatch, getState, undefined)

    expect(dispatch).toHaveBeenCalledWith({ type: 'auth/setUnauthenticated' })
    expect(dispatch).toHaveBeenCalledWith({
      type: 'notifications/show',
      payload: expect.objectContaining({
        groupKey: SESSION_EXPIRED_GROUP_KEY,
        variant: 'error',
      }),
    })
    expect(Router.replace).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
  })

  it('is a no-op when sessionExpiresAt is null (already logged out / already handled)', () => {
    const { dispatch, getState } = setup(makeState(null))

    sessionExpired()(dispatch, getState, undefined)

    expect(dispatch).not.toHaveBeenCalled()
    expect(Router.replace).not.toHaveBeenCalled()
  })

  it('is idempotent across parallel calls — only the first gets through before state clears', () => {
    let sessionExpiresAt: number | null = Date.now() + 60_000
    const dispatch = jest.fn((action) => {
      if (typeof action === 'object' && action.type === 'auth/setUnauthenticated') {
        sessionExpiresAt = null
      }
      return action
    }) as unknown as AppDispatch & jest.Mock
    const getState = jest.fn(() => makeState(sessionExpiresAt))

    sessionExpired()(dispatch, getState, undefined)
    sessionExpired()(dispatch, getState, undefined)
    sessionExpired()(dispatch, getState, undefined)

    expect(Router.replace).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ type: 'auth/setUnauthenticated' })
    const showCalls = dispatch.mock.calls.filter(([a]) => typeof a === 'object' && a.type === 'notifications/show')
    expect(showCalls).toHaveLength(1)
  })
})
