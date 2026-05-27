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

    it('returns true for /v1/chains/{chainId}/safes/{safeAddress}/positions/{fiatCode}', () => {
      expect(isProtectedEndpoint('/v1/chains/1/safes/0xABC/positions/USD')).toBe(true)
      expect(isProtectedEndpoint('/v1/chains/100/safes/0xDEF/positions/EUR')).toBe(true)
    })

    it('returns true for /v1/portfolio/{address}', () => {
      expect(isProtectedEndpoint('/v1/portfolio/0xABC')).toBe(true)
      expect(isProtectedEndpoint('/v1/portfolio/0xDEF?sync=true&excludeDust=false')).toBe(true)
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

    it('returns false for partial positions path matches (no /{fiatCode} suffix)', () => {
      expect(isProtectedEndpoint('/v1/chains/1/safes/0xABC/positions')).toBe(false)
      expect(isProtectedEndpoint('/v1/chains/1/safes/0xABC/positions/')).toBe(false)
    })

    it('returns false for partial portfolio path matches (no /{address} suffix)', () => {
      expect(isProtectedEndpoint('/v1/portfolio')).toBe(false)
      expect(isProtectedEndpoint('/v1/portfolio/')).toBe(false)
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
  // prepareHeaders hook — single-use token invalidation (lazy rotation)
  // ---------------------------------------------------------------------------
  describe('prepareHeaders hook — single-use token invalidation', () => {
    it('clears the shared token after consuming it, without eagerly refreshing the widget', async () => {
      const mockRefresh = jest.fn()
      registerWidgetRefreshCallback(mockRefresh)
      initializeCaptchaHeaders()
      resolveCaptchaReady()
      sharedTokenRef.current = 'first-token'

      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headers = new Headers()
      await hook(headers, PROTECTED_URL)

      expect(headers.get('X-Captcha-Token')).toBe('first-token')
      expect(sharedTokenRef.current).toBeNull()
      // Lazy rotation: no refresh is triggered just because a token was consumed;
      // the next hook invocation will refresh only if a new request actually arrives.
      expect(mockRefresh).not.toHaveBeenCalled()
    })

    it('lazily refreshes the widget when a subsequent request finds no token', async () => {
      // First run seeds and consumes 'first-token'.
      const mockRefresh = jest.fn(() => {
        sharedTokenRef.current = 'next-token'
        resolveCaptchaReady()
      })
      registerWidgetRefreshCallback(mockRefresh)
      initializeCaptchaHeaders()
      resolveCaptchaReady()
      sharedTokenRef.current = 'first-token'

      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headersA = new Headers()
      await hook(headersA, PROTECTED_URL)
      expect(headersA.get('X-Captcha-Token')).toBe('first-token')
      expect(mockRefresh).not.toHaveBeenCalled()

      // Second request arrives after the token was consumed — widget refresh is triggered now.
      const headersB = new Headers()
      await hook(headersB, PROTECTED_URL)

      expect(mockRefresh).toHaveBeenCalledTimes(1)
      expect(headersB.get('X-Captcha-Token')).toBe('next-token')
    })

    it('does not trigger a widget refresh while an initial challenge is still in flight', async () => {
      const mockRefresh = jest.fn()
      registerWidgetRefreshCallback(mockRefresh)
      initializeCaptchaHeaders()
      // Do NOT call resolveCaptchaReady — the initial promise is still pending.

      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const hookPromise = hook(new Headers(), PROTECTED_URL)

      // Give microtasks a chance to run; the lazy refresh must not fire because
      // captchaReadyResolve is still set (challenge in flight).
      await Promise.resolve()
      expect(mockRefresh).not.toHaveBeenCalled()

      // Resolve so the hook can complete and we don't leave a dangling promise.
      sharedTokenRef.current = 'initial-token'
      resolveCaptchaReady()
      await hookPromise
    })

    it('serializes concurrent protected requests so each awaits its own fresh token', async () => {
      // Simulate a widget refresh that produces a new token and resolves the promise
      const mockRefresh = jest.fn(() => {
        sharedTokenRef.current = 'next-token'
        resolveCaptchaReady()
      })
      registerWidgetRefreshCallback(mockRefresh)
      initializeCaptchaHeaders()

      // Seed the first token and resolve the initial promise
      sharedTokenRef.current = 'first-token'
      resolveCaptchaReady()

      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headersA = new Headers()
      const headersB = new Headers()

      // Fire both requests concurrently
      const [,] = await Promise.all([hook(headersA, PROTECTED_URL), hook(headersB, PROTECTED_URL)])

      // Each request must carry a distinct token
      expect(headersA.get('X-Captcha-Token')).toBe('first-token')
      expect(headersB.get('X-Captcha-Token')).toBe('next-token')
      // Only B's lazy refresh fires — A consumed the pre-seeded token without refreshing.
      expect(mockRefresh).toHaveBeenCalledTimes(1)
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

    it('clears token on captcha 401 from protected URL without eagerly refreshing the widget', async () => {
      const mockRefresh = jest.fn()
      registerWidgetRefreshCallback(mockRefresh)
      sharedTokenRef.current = 'old-token'
      initializeCaptchaHeaders()

      const hook = mockSetHandleResponseHook.mock.calls[0][0]
      await hook(makeResponse(401, { message: 'Invalid CAPTCHA token' }), PROTECTED_URL)

      expect(sharedTokenRef.current).toBeNull()
      // Lazy rotation: don't refresh the widget on 401 — the retry or next
      // protected request triggers a fresh challenge via prepareHeaders.
      expect(mockRefresh).not.toHaveBeenCalled()
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
