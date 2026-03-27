// Use dynamic requires to get a fresh module instance per test (resets module-level state)
describe('captchaHeadersInit', () => {
  let resolveCaptchaReady: () => void
  let resetCaptchaPromise: () => void
  let initializeCaptchaHeaders: () => void
  let sharedTokenRef: { current: string | null }
  let registerWidgetRefreshCallback: (callback: () => void) => void
  let mockSetPrepareHeadersHook: jest.Mock
  let mockSetHandleResponseHook: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    jest.doMock('@safe-global/store/gateway/cgwClient', () => ({
      setPrepareHeadersHook: jest.fn(),
      setHandleResponseHook: jest.fn(),
    }))
    ;({
      resolveCaptchaReady,
      resetCaptchaPromise,
      initializeCaptchaHeaders,
      sharedTokenRef,
      registerWidgetRefreshCallback,
    } = require('@/components/common/Captcha/captchaHeadersInit'))
    ;({
      setPrepareHeadersHook: mockSetPrepareHeadersHook,
      setHandleResponseHook: mockSetHandleResponseHook,
    } = require('@safe-global/store/gateway/cgwClient'))
  })

  describe('resolveCaptchaReady', () => {
    it('resolves the captcha ready promise so the header hook can proceed', async () => {
      initializeCaptchaHeaders()
      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headers = new Headers()

      let resolved = false
      const hookPromise = hook(headers).then(() => {
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

  describe('resetCaptchaPromise', () => {
    it('creates a new pending promise after the previous one was resolved', async () => {
      initializeCaptchaHeaders()
      resolveCaptchaReady()
      resetCaptchaPromise()

      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headers = new Headers()

      let resolved = false
      const hookPromise = hook(headers).then(() => {
        resolved = true
      })

      await Promise.resolve()
      expect(resolved).toBe(false)

      resolveCaptchaReady()
      await hookPromise
      expect(resolved).toBe(true)
    })
  })

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
      await hook(headers)

      expect(headers.get('X-Captcha-Token')).toBe('test-token')
    })

    it('does not add X-Captcha-Token header when token is null', async () => {
      initializeCaptchaHeaders()
      resolveCaptchaReady()
      sharedTokenRef.current = null

      const hook = mockSetPrepareHeadersHook.mock.calls[0][0]
      const headers = new Headers()
      await hook(headers)

      expect(headers.get('X-Captcha-Token')).toBeNull()
    })
  })

  describe('responseHook', () => {
    const makeResponse = (status: number, body: unknown) =>
      ({
        status,
        clone: () => ({ json: () => Promise.resolve(body) }),
      } as unknown as Response)

    const makeUnreadableResponse = (status: number) =>
      ({
        status,
        clone: () => ({ json: () => Promise.reject(new Error('not json')) }),
      } as unknown as Response)

    it('clears token, resets promise, and calls widget refresh on captcha 401', async () => {
      const mockRefresh = jest.fn()
      registerWidgetRefreshCallback(mockRefresh)
      sharedTokenRef.current = 'old-token'
      initializeCaptchaHeaders()

      const hook = mockSetHandleResponseHook.mock.calls[0][0]
      await hook(makeResponse(401, { message: 'Invalid CAPTCHA token' }))

      expect(sharedTokenRef.current).toBeNull()
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })

    it('does nothing for a non-401 response', async () => {
      const mockRefresh = jest.fn()
      registerWidgetRefreshCallback(mockRefresh)
      sharedTokenRef.current = 'token'
      initializeCaptchaHeaders()

      const hook = mockSetHandleResponseHook.mock.calls[0][0]
      await hook(makeResponse(200, { message: 'Invalid CAPTCHA token' }))

      expect(sharedTokenRef.current).toBe('token')
      expect(mockRefresh).not.toHaveBeenCalled()
    })

    it('does nothing for a 401 with a different message', async () => {
      const mockRefresh = jest.fn()
      registerWidgetRefreshCallback(mockRefresh)
      sharedTokenRef.current = 'token'
      initializeCaptchaHeaders()

      const hook = mockSetHandleResponseHook.mock.calls[0][0]
      await hook(makeResponse(401, { message: 'Unauthorized' }))

      expect(sharedTokenRef.current).toBe('token')
      expect(mockRefresh).not.toHaveBeenCalled()
    })

    it('does not throw when the response body is not JSON', async () => {
      initializeCaptchaHeaders()
      const hook = mockSetHandleResponseHook.mock.calls[0][0]
      await expect(hook(makeUnreadableResponse(401))).resolves.not.toThrow()
    })
  })
})
