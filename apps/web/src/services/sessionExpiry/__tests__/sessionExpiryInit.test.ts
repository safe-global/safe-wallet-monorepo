import { shouldTriggerSessionExpiry, isSessionExpiryExcluded } from '../sessionExpiryInit'

describe('sessionExpiry — URL filter', () => {
  describe('isSessionExpiryExcluded', () => {
    it.each([
      ['/v1/auth/me', true],
      ['/v1/auth/verify', true],
      ['/v1/auth/logout', true],
      ['/v1/auth/logout/redirect', true],
      ['/v1/auth/nonce', false],
      ['/v1/spaces', false],
      ['/v1/users', false],
    ])('%s -> %s', (url, expected) => {
      expect(isSessionExpiryExcluded(url)).toBe(expected)
    })
  })

  describe('shouldTriggerSessionExpiry', () => {
    it.each([
      // Triggers: 403 on credentialed routes that are NOT in the exclusion list
      [403, '/v1/spaces', true],
      [403, '/v1/spaces/123/safes', true],
      [403, '/v1/users', true],
      [403, '/v1/users/me', true],
      [403, '/v1/auth/nonce', true],

      // Does NOT trigger: excluded auth probe routes
      [403, '/v1/auth/me', false],
      [403, '/v1/auth/verify', false],
      [403, '/v1/auth/logout', false],
      [403, '/v1/auth/logout/redirect', false],

      // Does NOT trigger: 403 on non-credentialed routes
      [403, '/v1/chains/1/safes', false],
      [403, '/v1/some/random/path', false],

      // Does NOT trigger: non-403 statuses
      [200, '/v1/spaces', false],
      [401, '/v1/spaces', false],
      [404, '/v1/spaces', false],
      [500, '/v1/spaces', false],
    ])('status=%s url=%s -> trigger=%s', (status, url, expected) => {
      expect(shouldTriggerSessionExpiry(status, url)).toBe(expected)
    })
  })
})

describe('sessionExpiry — initialization side effects', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('registers exactly one response hook on first call and is idempotent', () => {
    const addHandleResponseHook = jest.fn()
    jest.doMock('@safe-global/store/gateway/cgwClient', () => ({
      addHandleResponseHook,
      isCredentialRoute: () => true,
    }))
    jest.doMock('@/store', () => ({ getStoreInstance: jest.fn() }))
    jest.doMock('@/store/sessionExpired', () => ({ sessionExpired: jest.fn() }))

    const { initializeSessionExpiry } = require('../sessionExpiryInit')

    initializeSessionExpiry()
    initializeSessionExpiry()
    initializeSessionExpiry()

    expect(addHandleResponseHook).toHaveBeenCalledTimes(1)
  })

  it('dispatches sessionExpired on a credentialed 403 outside the exclusion list', () => {
    const dispatch = jest.fn()
    const sessionExpiredAction = { type: 'sessionExpired' }
    const sessionExpired = jest.fn(() => sessionExpiredAction)
    let hookFn: ((response: Response, url: string) => void) | undefined

    jest.doMock('@safe-global/store/gateway/cgwClient', () => ({
      addHandleResponseHook: (fn: typeof hookFn) => {
        hookFn = fn
      },
      isCredentialRoute: (url: string) => /\/v1\/(spaces|users|auth)/.test(url),
    }))
    jest.doMock('@/store', () => ({ getStoreInstance: () => ({ dispatch }) }))
    jest.doMock('@/store/sessionExpired', () => ({ sessionExpired }))

    const { initializeSessionExpiry } = require('../sessionExpiryInit')
    initializeSessionExpiry()

    hookFn?.({ status: 403 } as Response, '/v1/spaces/123')
    expect(sessionExpired).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith(sessionExpiredAction)
  })

  it('does not dispatch sessionExpired on excluded auth probe routes', () => {
    const dispatch = jest.fn()
    const sessionExpired = jest.fn()
    let hookFn: ((response: Response, url: string) => void) | undefined

    jest.doMock('@safe-global/store/gateway/cgwClient', () => ({
      addHandleResponseHook: (fn: typeof hookFn) => {
        hookFn = fn
      },
      isCredentialRoute: () => true,
    }))
    jest.doMock('@/store', () => ({ getStoreInstance: () => ({ dispatch }) }))
    jest.doMock('@/store/sessionExpired', () => ({ sessionExpired }))

    const { initializeSessionExpiry } = require('../sessionExpiryInit')
    initializeSessionExpiry()

    hookFn?.({ status: 403 } as Response, '/v1/auth/me')
    hookFn?.({ status: 403 } as Response, '/v1/auth/verify')
    hookFn?.({ status: 403 } as Response, '/v1/auth/logout')

    expect(sessionExpired).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalled()
  })
})
