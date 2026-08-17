import { registerServiceWorker } from '../registerServiceWorker'

jest.mock('@/services/observability', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

const { logger } = jest.requireMock('@/services/observability') as { logger: { info: jest.Mock } }

describe('registerServiceWorker', () => {
  const originalServiceWorker = (navigator as unknown as { serviceWorker?: unknown }).serviceWorker

  afterEach(() => {
    jest.clearAllMocks()
    delete (window as unknown as { workbox?: unknown }).workbox
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      configurable: true,
    })
  })

  // `'serviceWorker' in navigator` checks for the property key regardless of its
  // value, so simulating "unsupported" requires deleting the property, not just
  // setting it to `undefined`.
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
  })

  it('does nothing when serviceWorker is not supported (e.g. some private-browsing modes)', async () => {
    setServiceWorkerSupport(false)
    const register = jest.fn()
    window.workbox = { register } as unknown as Window['workbox']

    await registerServiceWorker()

    expect(register).not.toHaveBeenCalled()
  })

  it('does nothing when window.workbox was never created', async () => {
    setServiceWorkerSupport(true)

    await expect(registerServiceWorker()).resolves.toBeUndefined()
  })

  it('does not throw and does not log when registration resolves without a registration object', async () => {
    setServiceWorkerSupport(true)
    const register = jest.fn().mockResolvedValue(undefined)
    window.workbox = { register } as unknown as Window['workbox']

    await expect(registerServiceWorker()).resolves.toBeUndefined()
    expect(logger.info).not.toHaveBeenCalled()
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

  it('catches the TypeError thrown when workbox-window attaches "updatefound" to an undefined registration', async () => {
    setServiceWorkerSupport(true)
    const typeError = new TypeError('l.fn.addEventListener is not a function')
    const register = jest.fn().mockRejectedValue(typeError)
    window.workbox = { register } as unknown as Window['workbox']

    await expect(registerServiceWorker()).resolves.toBeUndefined()

    expect(logger.info).toHaveBeenCalledWith('Service worker registration failed', { error: typeError.message })
  })
})
