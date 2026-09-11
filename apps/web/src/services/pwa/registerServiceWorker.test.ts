import { registerServiceWorker, __resetRegisterServiceWorkerForTests } from './registerServiceWorker'

jest.mock('@/services/observability', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

const { logger } = jest.requireMock('@/services/observability') as { logger: { info: jest.Mock; warn: jest.Mock } }

describe('registerServiceWorker', () => {
  const originalServiceWorker = (navigator as unknown as { serviceWorker?: unknown }).serviceWorker

  afterEach(() => {
    jest.clearAllMocks()
    __resetRegisterServiceWorkerForTests()
    delete (window as unknown as { workbox?: unknown }).workbox
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      configurable: true,
    })
  })

  // `'serviceWorker' in navigator` is a key check, so "unsupported" means
  // deleting the property, not setting it to `undefined`.
  const setServiceWorkerSupport = (supported: boolean) => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {},
      configurable: true,
    })
    if (!supported) {
      delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker
    }
  }

  it('registers via window.workbox when the registration resolves successfully', async () => {
    setServiceWorkerSupport(true)
    const register = jest.fn().mockResolvedValue({ scope: '/' })
    window.workbox = { register } as unknown as Window['workbox']

    await registerServiceWorker()

    expect(register).toHaveBeenCalledTimes(1)
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('does nothing when serviceWorker is not supported (e.g. some private-browsing modes)', async () => {
    setServiceWorkerSupport(false)
    const register = jest.fn()
    window.workbox = { register } as unknown as Window['workbox']

    await registerServiceWorker()

    expect(register).not.toHaveBeenCalled()
  })

  it('logs a warning and does nothing when serviceWorker is supported but window.workbox is unavailable', async () => {
    setServiceWorkerSupport(true)

    await expect(registerServiceWorker()).resolves.toBeUndefined()

    expect(logger.warn).toHaveBeenCalledWith('Service worker registration skipped: window.workbox is unavailable')
  })

  it('catches a rejected registration (e.g. AbortError on unreachable sw.js) and logs it at info level', async () => {
    setServiceWorkerSupport(true)
    const abortError = new DOMException('Failed to register a ServiceWorker', 'AbortError')
    const register = jest.fn().mockRejectedValue(abortError)
    window.workbox = { register } as unknown as Window['workbox']

    await expect(registerServiceWorker()).resolves.toBeUndefined()

    expect(logger.info).toHaveBeenCalledTimes(1)
    expect(logger.info).toHaveBeenCalledWith('Service worker registration failed', { error: abortError.message })
  })

  it('catches the TypeError from a WebView stub registration and logs it at info level', async () => {
    // The production cluster: the stub resolves truthy but has no
    // `addEventListener`, so workbox-window throws and rejects `register()`.
    setServiceWorkerSupport(true)
    const typeError = new TypeError('l.fn.addEventListener is not a function')
    const register = jest.fn().mockRejectedValue(typeError)
    window.workbox = { register } as unknown as Window['workbox']

    await expect(registerServiceWorker()).resolves.toBeUndefined()

    expect(logger.info).toHaveBeenCalledWith('Service worker registration failed', { error: typeError.message })
  })

  it('only attempts registration once even if called multiple times', async () => {
    setServiceWorkerSupport(true)
    const register = jest.fn().mockResolvedValue({ scope: '/' })
    window.workbox = { register } as unknown as Window['workbox']

    await registerServiceWorker()
    await registerServiceWorker()
    await registerServiceWorker()

    expect(register).toHaveBeenCalledTimes(1)
  })
})
