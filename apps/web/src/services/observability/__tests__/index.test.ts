describe('Observability Module', () => {
  it('should export logger with all methods', () => {
    jest.isolateModules(() => {
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

      const { logger } = require('../index')

      expect(logger).toBeDefined()
      expect(logger).toHaveProperty('info')
      expect(logger).toHaveProperty('warn')
      expect(logger).toHaveProperty('error')
      expect(logger).toHaveProperty('debug')
    })
  })

  it('should export captureException function', () => {
    jest.isolateModules(() => {
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

      expect(captureException).toBeDefined()
      expect(typeof captureException).toBe('function')
    })
  })

  it('should not throw when logger methods are called', () => {
    jest.isolateModules(() => {
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

      const { logger } = require('../index')

      expect(() => logger.info('test')).not.toThrow()
      expect(() => logger.warn('test')).not.toThrow()
      expect(() => logger.error('test')).not.toThrow()
      expect(() => logger.debug('test')).not.toThrow()
    })
  })

  it('should not throw when captureException is called', () => {
    jest.isolateModules(() => {
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
      const error = new Error('test error')

      expect(() => captureException(error)).not.toThrow()
    })
  })

  it('should queue captureException until init completes', async () => {
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

      captureException(error)
    })

    if (!mockProvider || !resolveInit) {
      throw new Error('Test setup failed')
    }

    expect(mockProvider.captureException).not.toHaveBeenCalled()

    resolveInit()
    await initPromise
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockProvider.captureException).toHaveBeenCalledWith(error, undefined)
  })

  it('should initialize provider synchronously at module load', () => {
    jest.isolateModules(() => {
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

      require('../index')

      expect(mockProvider.init).toHaveBeenCalled()
    })
  })
})
