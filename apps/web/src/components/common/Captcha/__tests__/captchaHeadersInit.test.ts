// Use dynamic requires to get a fresh module instance per test (resets module-level state)
describe('captchaHeadersInit', () => {
  let resolveCaptchaReady: () => void
  let resetCaptchaPromise: () => void
  let initializeCaptchaHeaders: () => void
  let sharedTokenRef: { current: string | null }
  let registerWidgetRefreshCallback: (callback: () => void) => void
  let registerActivateCaptcha: (callback: () => void) => void
  let isCaptchaActivated: () => boolean
  let isProtectedEndpoint: (url: string) => boolean
  let mockSetPrepareHeadersHook: jest.Mock
  let mockSetHandleResponseHook: jest.Mock

  const PROTECTED_URL = '/v2/owners/0xABC123/safes'
  const NON_PROTECTED_URL = '/v1/chains/1/safes'

  beforeEach(() => {
    jest.resetModules()
    jest.doMock('@safe-global/store/gateway/cgwClient', () => ({
      setPrepareHeadersHook: jest.fn(),
      setHandleResponseHook: jest.fn(),
    }))
    jest.doMock('@safe-global/utils/config/constants', () => ({
      TURNSTILE_SITE_KEY: 'test-site-key',
    }))
    ;({
      resolveCaptchaReady,
      resetCaptchaPromise,
      initializeCaptchaHeaders,
      sharedTokenRef,
      registerWidgetRefreshCallback,
      registerActivateCaptcha,
      isCaptchaActivated,
      isProtectedEndpoint,
    } = require('@/components/common/Captcha/captchaHeadersInit'))
    ;({
      setPrepareHeadersHook: mockSetPrepareHeadersHook,
      setHandleResponseHook: mockSetHandleResponseHook,
    } = require('@safe-global/store/gateway/cgwClient'))
  })

  // ---------------------------------------------------------------------------
  // isProtectedEndpoint
  // ---------------------------------------------------------------------------
  describe('isProtectedEndpoint', () => {
    it('returns true for /v2/owners/{ownerAddress}/safes', () => {
      expect(isProtectedEndpoint('/v2/owners/0xDEF/safes')).toBe(true)
    })

    it('returns true for /v3/owners/{ownerAddress}/safes', () => {
      expect(isProtectedEndpoint('/v3/owners/0x123/safes')).toBe(true)
    })

    it('returns false for unrelated endpoints', () => {
      expect(isProtectedEndpoint('/v1/chains/1/safes')).toBe(false)
      expect(isProtectedEndpoint('/v1/chains/1/owners/0xABC/safes')).toBe(false)
      expect(isProtectedEndpoint('/v1/users')).toBe(false)
      expect(isProtectedEndpoint('/v2/register/notifications')).toBe(false)
    })

    it('returns false for partial owner path matches (no /safes suffix)', () => {
      expect(isProtectedEndpoint('/v2/owners/0xABC')).toBe(false)
      expect(isProtectedEndpoint('/v3/owners/0xABC')).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // resolveCaptchaReady
  // ---------------------------------------------------------------------------
  describe('resolveCaptchaReady', () => {
    it('resolves the captcha ready promise so the header hook can proceed', async () => {
      initializeCaptchaHeaders()
      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headers = new Headers()

      let resolved = false
      const hookPromise = hook(headers, PROTECTED_URL).then(() => {
        resolved = true
      })

      expect(resolved).toBe(false)
      resolveCaptchaReady()
      await hookPromise
      expect(resolved).toBe(true)
    })

    it('is idempotent — calling twice does not throw', () => {
      initializeCaptchaHeaders()
      expect(() => {
        resolveCaptchaReady()
        resolveCaptchaReady()
      }).not.toThrow()
    })
  })

  // ---------------------------------------------------------------------------
  // resetCaptchaPromise
  // ---------------------------------------------------------------------------
  describe('resetCaptchaPromise', () => {
    it('creates a new pending promise after the previous one was resolved', async () => {
      initializeCaptchaHeaders()
      resolveCaptchaReady()
      resetCaptchaPromise()

      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headers = new Headers()

      let resolved = false
      const hookPromise = hook(headers, PROTECTED_URL).then(() => {
        resolved = true
      })

      await Promise.resolve()
      expect(resolved).toBe(false)

      resolveCaptchaReady()
      await hookPromise
      expect(resolved).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // initializeCaptchaHeaders
  // ---------------------------------------------------------------------------
  describe('initializeCaptchaHeaders', () => {
    it('registers a prepare-headers hook', () => {
      initializeCaptchaHeaders()
      expect(mockSetPrepareHeadersHook).toHaveBeenCalledTimes(1)
    })

    it('registers a handle-response hook', () => {
      initializeCaptchaHeaders()
      expect(mockSetHandleResponseHook).toHaveBeenCalledTimes(1)
    })

    it('is idempotent — registers hooks only once', () => {
      initializeCaptchaHeaders()
      initializeCaptchaHeaders()
      expect(mockSetPrepareHeadersHook).toHaveBeenCalledTimes(1)
      expect(mockSetHandleResponseHook).toHaveBeenCalledTimes(1)
    })

    it('adds X-Captcha-Token header when token is set', async () => {
      initializeCaptchaHeaders()
      resolveCaptchaReady()
      sharedTokenRef.current = 'test-token'

      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headers = new Headers()
      await hook(headers, PROTECTED_URL)

      expect(headers.get('X-Captcha-Token')).toBe('test-token')
    })

    it('does not add X-Captcha-Token header when token is null', async () => {
      initializeCaptchaHeaders()
      resolveCaptchaReady()
      sharedTokenRef.current = null

      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headers = new Headers()
      await hook(headers, PROTECTED_URL)

      expect(headers.get('X-Captcha-Token')).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // prepareHeaders hook — URL scoping
  // ---------------------------------------------------------------------------
  describe('prepareHeaders hook — URL scoping', () => {
    it('returns headers immediately for non-protected URLs without waiting for captcha', async () => {
      initializeCaptchaHeaders()
      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headers = new Headers()

      // Do NOT resolve captcha — promise stays pending
      let settled = false
      const hookPromise = hook(headers, NON_PROTECTED_URL).then(() => {
        settled = true
      })

      // Flush microtasks — should resolve without waiting
      await Promise.resolve()
      expect(settled).toBe(true)
      await hookPromise
    })

    it('blocks for protected URLs until captcha is resolved', async () => {
      initializeCaptchaHeaders()
      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headers = new Headers()

      let settled = false
      const hookPromise = hook(headers, PROTECTED_URL).then(() => {
        settled = true
      })

      await Promise.resolve()
      expect(settled).toBe(false)

      resolveCaptchaReady()
      await hookPromise
      expect(settled).toBe(true)
    })

    it('does not add X-Captcha-Token to non-protected URL responses', async () => {
      initializeCaptchaHeaders()
      sharedTokenRef.current = 'my-token'
      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headers = new Headers()

      await hook(headers, NON_PROTECTED_URL)
      expect(headers.get('X-Captcha-Token')).toBeNull()
    })

    it('calls the activation callback on the first protected URL request', async () => {
      const mockActivate = jest.fn()
      registerActivateCaptcha(mockActivate)
      initializeCaptchaHeaders()
      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]

      const hookPromise = hook(new Headers(), PROTECTED_URL)
      expect(mockActivate).toHaveBeenCalledTimes(1)

      resolveCaptchaReady()
      await hookPromise
    })

    it('calls the activation callback only once across multiple protected requests', async () => {
      const mockActivate = jest.fn()
      registerActivateCaptcha(mockActivate)
      initializeCaptchaHeaders()
      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]

      resolveCaptchaReady()
      await hook(new Headers(), PROTECTED_URL)

      mockActivate.mockClear()
      resetCaptchaPromise()
      resolveCaptchaReady()
      await hook(new Headers(), '/v3/owners/0xDEF/safes')

      expect(mockActivate).not.toHaveBeenCalled()
    })

    it('isCaptchaActivated returns true after first protected request', async () => {
      initializeCaptchaHeaders()
      expect(isCaptchaActivated()).toBe(false)
      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      resolveCaptchaReady()
      await hook(new Headers(), PROTECTED_URL)
      expect(isCaptchaActivated()).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // responseHook
  // ---------------------------------------------------------------------------
  describe('responseHook', () => {
    const makeResponse = (status: number, body: unknown) =>
      ({
        status,
        clone: () => ({ json: () => Promise.resolve(body) }),
      }) as unknown as Response

    const makeUnreadableResponse = (status: number) =>
      ({
        status,
        clone: () => ({ json: () => Promise.reject(new Error('not json')) }),
      }) as unknown as Response

    it('clears token, resets promise, and calls widget refresh on captcha 401 from protected URL', async () => {
      const mockRefresh = jest.fn()
      registerWidgetRefreshCallback(mockRefresh)
      sharedTokenRef.current = 'old-token'
      initializeCaptchaHeaders()

      const hook = mockSetHandleResponseHook.mock.calls[0][0]
      await hook(makeResponse(401, { message: 'Invalid CAPTCHA token' }), PROTECTED_URL)

      expect(sharedTokenRef.current).toBeNull()
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })

    it('does nothing for a captcha 401 from a non-protected URL', async () => {
      const mockRefresh = jest.fn()
      registerWidgetRefreshCallback(mockRefresh)
      sharedTokenRef.current = 'old-token'
      initializeCaptchaHeaders()

      const hook = mockSetHandleResponseHook.mock.calls[0][0]
      await hook(makeResponse(401, { message: 'Invalid CAPTCHA token' }), NON_PROTECTED_URL)

      expect(sharedTokenRef.current).toBe('old-token')
      expect(mockRefresh).not.toHaveBeenCalled()
    })

    it('does nothing for a non-401 response', async () => {
      const mockRefresh = jest.fn()
      registerWidgetRefreshCallback(mockRefresh)
      sharedTokenRef.current = 'token'
      initializeCaptchaHeaders()

      const hook = mockSetHandleResponseHook.mock.calls[0][0]
      await hook(makeResponse(200, { message: 'Invalid CAPTCHA token' }), PROTECTED_URL)

      expect(sharedTokenRef.current).toBe('token')
      expect(mockRefresh).not.toHaveBeenCalled()
    })

    it('does nothing for a 401 with a different message', async () => {
      const mockRefresh = jest.fn()
      registerWidgetRefreshCallback(mockRefresh)
      sharedTokenRef.current = 'token'
      initializeCaptchaHeaders()

      const hook = mockSetHandleResponseHook.mock.calls[0][0]
      await hook(makeResponse(401, { message: 'Unauthorized' }), PROTECTED_URL)

      expect(sharedTokenRef.current).toBe('token')
      expect(mockRefresh).not.toHaveBeenCalled()
    })

    it('does not throw when the response body is not JSON', async () => {
      initializeCaptchaHeaders()
      const hook = mockSetHandleResponseHook.mock.calls[0][0]
      await expect(hook(makeUnreadableResponse(401), PROTECTED_URL)).resolves.not.toThrow()
    })
  })
})
