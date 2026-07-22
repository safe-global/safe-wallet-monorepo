describe('Observability Module', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  describe('initObservability', () => {
    it('should call provider.init() on client-side', async () => {
      const mockProvider = {
        name: 'Mock',
        init: jest.fn().mockResolvedValue(undefined),
        getLogger: jest.fn(() => ({
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        })),
        captureError: jest.fn(),
      }

      jest.isolateModules(() => {
        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { initObservability } = require('../index')
        initObservability()

        expect(mockProvider.init).toHaveBeenCalledTimes(1)
      })
    })

    it('should be a no-op on server-side', () => {
      const windowSpy = jest.spyOn(global, 'window', 'get')
      windowSpy.mockReturnValue(undefined as any)

      const mockProvider = {
        name: 'Mock',
        init: jest.fn().mockResolvedValue(undefined),
        getLogger: jest.fn(() => ({
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        })),
        captureError: jest.fn(),
      }

      jest.isolateModules(() => {
        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { initObservability } = require('../index')
        initObservability()

        // Should not call init on server-side
        expect(mockProvider.init).not.toHaveBeenCalled()
      })

      windowSpy.mockRestore()
    })

    it('should handle initialization errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const initError = new Error('init failed')

      const mockProvider = {
        name: 'Mock',
        init: jest.fn().mockRejectedValue(initError),
        getLogger: jest.fn(() => ({
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        })),
        captureError: jest.fn(),
      }

      await jest.isolateModulesAsync(async () => {
        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { initObservability } = require('../index')
        initObservability()

        // Wait for promise rejection to be handled
        await new Promise((resolve) => setTimeout(resolve, 10))

        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize observability provider:', initError)
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('captureError', () => {
    it('should delegate to provider', () => {
      const mockProvider = {
        name: 'Mock',
        init: jest.fn(),
        getLogger: jest.fn(() => ({
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        })),
        captureError: jest.fn(),
      }

      jest.isolateModules(() => {
        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { captureError } = require('../index')
        const observed = {
          error: new Error('test error'),
          isUserFacing: true,
          code: 100,
          tags: { componentStack: 'Component Stack' },
        }

        captureError(observed)

        expect(mockProvider.captureError).toHaveBeenCalledWith(observed)
      })
    })
  })

  describe('provider injection', () => {
    const makeMockProvider = (name: string) => ({
      name,
      init: jest.fn().mockResolvedValue(undefined),
      getLogger: jest.fn(() => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() })),
      captureError: jest.fn(),
    })

    it('fully replaces the default provider with consumer-provided providers', () => {
      const defaultProvider = makeMockProvider('Default')
      const injected = makeMockProvider('Injected')

      jest.isolateModules(() => {
        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => defaultProvider),
        }))

        const { initObservability, captureError } = require('../index')
        initObservability([injected])

        expect(injected.init).toHaveBeenCalledTimes(1)
        expect(defaultProvider.init).not.toHaveBeenCalled()

        const observed = { error: new Error('boom'), isUserFacing: true }
        captureError(observed)
        expect(injected.captureError).toHaveBeenCalledWith(observed)
        expect(defaultProvider.captureError).not.toHaveBeenCalled()
      })
    })

    it('fans errors out to every injected provider', () => {
      const provider1 = makeMockProvider('One')
      const provider2 = makeMockProvider('Two')

      jest.isolateModules(() => {
        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => makeMockProvider('Default')),
        }))

        const { initObservability, captureError } = require('../index')
        initObservability([provider1, provider2])

        const observed = { error: new Error('Code 601'), isUserFacing: false, code: 601 }
        captureError(observed)

        expect(provider1.captureError).toHaveBeenCalledWith(observed)
        expect(provider2.captureError).toHaveBeenCalledWith(observed)
      })
    })
  })

  describe('logger', () => {
    it('should delegate all logger methods to provider', () => {
      const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      }

      const mockProvider = {
        name: 'Mock',
        init: jest.fn(),
        getLogger: jest.fn(() => mockLogger),
        captureError: jest.fn(),
      }

      jest.isolateModules(() => {
        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { logger } = require('../index')

        logger.info('info message', { key: 'value' })
        logger.warn('warn message')
        logger.error('error message', { error: 'details' })
        logger.debug('debug message')

        expect(mockLogger.info).toHaveBeenCalledWith('info message', { key: 'value' })
        expect(mockLogger.warn).toHaveBeenCalledWith('warn message')
        expect(mockLogger.error).toHaveBeenCalledWith('error message', { error: 'details' })
        expect(mockLogger.debug).toHaveBeenCalledWith('debug message')
      })
    })
  })
})
