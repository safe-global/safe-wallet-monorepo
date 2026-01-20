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
        captureException: jest.fn(),
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
        captureException: jest.fn(),
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
        captureException: jest.fn(),
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

  describe('captureException', () => {
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
        captureException: jest.fn(),
      }

      jest.isolateModules(() => {
        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { captureException } = require('../index')
        const error = new Error('test error')
        const context = { userId: '123', componentStack: 'Component Stack' }

        captureException(error, context)

        expect(mockProvider.captureException).toHaveBeenCalledWith(error, context)
      })
    })

    it('should work without context', () => {
      const mockProvider = {
        name: 'Mock',
        init: jest.fn(),
        getLogger: jest.fn(() => ({
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
          debug: jest.fn(),
        })),
        captureException: jest.fn(),
      }

      jest.isolateModules(() => {
        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { captureException } = require('../index')
        const error = new Error('test error')

        captureException(error)

        expect(mockProvider.captureException).toHaveBeenCalledWith(error, undefined)
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
        captureException: jest.fn(),
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
