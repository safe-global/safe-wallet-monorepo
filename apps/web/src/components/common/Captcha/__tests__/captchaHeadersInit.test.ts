// Use dynamic requires to get a fresh module instance per test (resets module-level state)
describe('captchaHeadersInit', () => {
  let resolveCaptchaReady: () => void
  let resetCaptchaPromise: () => void
  let initializeCaptchaHeaders: () => void
  let sharedTokenRef: { current: string | null }
  let mockSetPrepareHeadersHook: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    jest.doMock('@safe-global/store/gateway/cgwClient', () => ({
      setPrepareHeadersHook: jest.fn(),
    }))
    ;({
      resolveCaptchaReady,
      resetCaptchaPromise,
      initializeCaptchaHeaders,
      sharedTokenRef,
    } = require('@/components/common/Captcha/captchaHeadersInit'))
    ;({ setPrepareHeadersHook: mockSetPrepareHeadersHook } = require('@safe-global/store/gateway/cgwClient'))
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

    it('is idempotent — registers the hook only once', () => {
      initializeCaptchaHeaders()
      initializeCaptchaHeaders()
      expect(mockSetPrepareHeadersHook).toHaveBeenCalledTimes(1)
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
})
