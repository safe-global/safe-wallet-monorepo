describe('Observability Module', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  describe('Module Initialization', () => {
    it('should initialize provider on client-side at module load', () => {
      jest.isolateModules(() => {
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

        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        require('../index')

        expect(mockProvider.init).toHaveBeenCalled()
      })
    })
  })

  describe('Exception Queue Management', () => {
    it('should queue exceptions before initialization completes', async () => {
      const error = new Error('test error')
      let resolveInit: (() => void) | undefined
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve
      })
      let mockProvider:
        | {
            name: string
            init: jest.Mock<Promise<void>>
            getLogger: jest.Mock
            captureException: jest.Mock
          }
        | undefined

      jest.isolateModules(() => {
        mockProvider = {
          name: 'Mock',
          init: jest.fn(() => initPromise),
          getLogger: jest.fn(() => ({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          })),
          captureException: jest.fn(),
        }

        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { captureException } = require('../index')

        // Capture exception before init completes
        captureException(error)
      })

      if (!mockProvider || !resolveInit) {
        throw new Error('Test setup failed')
      }

      // Should be queued, not captured yet
      expect(mockProvider.captureException).not.toHaveBeenCalled()

      // Complete initialization
      resolveInit()
      await initPromise
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Now it should be captured
      expect(mockProvider.captureException).toHaveBeenCalledWith(error, undefined)
    })

    it('should enforce MAX_QUEUED_EXCEPTIONS limit with FIFO eviction', async () => {
      let resolveInit: (() => void) | undefined
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve
      })
      let mockProvider:
        | {
            name: string
            init: jest.Mock<Promise<void>>
            getLogger: jest.Mock
            captureException: jest.Mock
          }
        | undefined

      jest.isolateModules(() => {
        mockProvider = {
          name: 'Mock',
          init: jest.fn(() => initPromise),
          getLogger: jest.fn(() => ({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          })),
          captureException: jest.fn(),
        }

        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { captureException } = require('../index')

        // Queue 26 exceptions (limit is 25)
        for (let i = 0; i < 26; i++) {
          captureException(new Error(`error ${i}`))
        }
      })

      if (!mockProvider || !resolveInit) {
        throw new Error('Test setup failed')
      }

      // Complete initialization
      resolveInit()
      await initPromise
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Should have captured exactly 25 exceptions
      expect(mockProvider.captureException).toHaveBeenCalledTimes(25)

      // First error should have been evicted (FIFO)
      const capturedErrors = mockProvider.captureException.mock.calls.map((call) => call[0].message)
      expect(capturedErrors).not.toContain('error 0')

      // Last 25 errors should be captured (errors 1-25)
      for (let i = 1; i <= 25; i++) {
        expect(capturedErrors).toContain(`error ${i}`)
      }
    })

    it('should clear queue and log error when initialization fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const initError = new Error('init failed')
      let mockProvider:
        | {
            name: string
            init: jest.Mock<Promise<void>>
            getLogger: jest.Mock
            captureException: jest.Mock
          }
        | undefined

      await jest.isolateModulesAsync(async () => {
        mockProvider = {
          name: 'Mock',
          init: jest.fn(() => Promise.reject(initError)),
          getLogger: jest.fn(() => ({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          })),
          captureException: jest.fn(),
        }

        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { captureException } = require('../index')

        // Queue some exceptions before init fails
        captureException(new Error('queued error 1'))
        captureException(new Error('queued error 2'))

        // Wait for init to fail
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      if (!mockProvider) {
        throw new Error('Test setup failed')
      }

      // Queued exceptions should not be captured (queue cleared on init failure)
      expect(mockProvider.captureException).not.toHaveBeenCalled()

      // Error should be logged to console
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize observability provider:', initError)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Server-side Behavior', () => {
    it('should bypass queue on server-side and capture immediately', () => {
      jest.isolateModules(() => {
        // Mock window as undefined to simulate server-side
        const windowSpy = jest.spyOn(global, 'window', 'get')
        windowSpy.mockReturnValue(undefined as any)

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

        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { captureException } = require('../index')

        const error = new Error('server error')
        captureException(error)

        // Should capture immediately on server-side (no queueing)
        expect(mockProvider.captureException).toHaveBeenCalledWith(error, undefined)

        windowSpy.mockRestore()
      })
    })
  })

  describe('Logger Delegation', () => {
    it('should delegate logger methods to provider', () => {
      jest.isolateModules(() => {
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

        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { logger } = require('../index')

        // Test logger delegation
        logger.info('info message', { key: 'value' })
        logger.warn('warn message')
        logger.error('error message', { error: 'details' })
        logger.debug('debug message')

        // Verify delegation to provider's logger
        expect(mockLogger.info).toHaveBeenCalledWith('info message', { key: 'value' })
        expect(mockLogger.warn).toHaveBeenCalledWith('warn message')
        expect(mockLogger.error).toHaveBeenCalledWith('error message', { error: 'details' })
        expect(mockLogger.debug).toHaveBeenCalledWith('debug message')
      })
    })
  })

  describe('Exception Context', () => {
    it('should pass context to captureException', async () => {
      const error = new Error('test error')
      const context = { componentStack: 'Component Stack', userId: '123' }
      let resolveInit: (() => void) | undefined
      const initPromise = new Promise<void>((resolve) => {
        resolveInit = resolve
      })
      let mockProvider:
        | {
            name: string
            init: jest.Mock<Promise<void>>
            getLogger: jest.Mock
            captureException: jest.Mock
          }
        | undefined

      jest.isolateModules(() => {
        mockProvider = {
          name: 'Mock',
          init: jest.fn(() => initPromise),
          getLogger: jest.fn(() => ({
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          })),
          captureException: jest.fn(),
        }

        jest.doMock('../factory', () => ({
          createObservabilityProvider: jest.fn(() => mockProvider),
        }))

        const { captureException } = require('../index')
        captureException(error, context)
      })

      if (!mockProvider || !resolveInit) {
        throw new Error('Test setup failed')
      }

      resolveInit()
      await initPromise
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Context should be passed through
      expect(mockProvider.captureException).toHaveBeenCalledWith(error, context)
    })
  })
})
