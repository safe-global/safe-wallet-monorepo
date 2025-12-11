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
        getErrorBoundary: jest.fn(() => undefined),
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
        getErrorBoundary: jest.fn(() => undefined),
      }

      jest.doMock('../factory', () => ({
        createObservabilityProvider: jest.fn(() => mockProvider),
      }))

      const { captureException } = require('../index')

      expect(captureException).toBeDefined()
      expect(typeof captureException).toBe('function')
    })
  })

  it('should export getErrorBoundary function', () => {
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
        getErrorBoundary: jest.fn(() => undefined),
      }

      jest.doMock('../factory', () => ({
        createObservabilityProvider: jest.fn(() => mockProvider),
      }))

      const { getErrorBoundary } = require('../index')

      expect(getErrorBoundary).toBeDefined()
      expect(typeof getErrorBoundary).toBe('function')
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
        getErrorBoundary: jest.fn(() => undefined),
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
        getErrorBoundary: jest.fn(() => undefined),
      }

      jest.doMock('../factory', () => ({
        createObservabilityProvider: jest.fn(() => mockProvider),
      }))

      const { captureException } = require('../index')
      const error = new Error('test error')

      expect(() => captureException(error)).not.toThrow()
    })
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
        getErrorBoundary: jest.fn(() => undefined),
      }

      jest.doMock('../factory', () => ({
        createObservabilityProvider: jest.fn(() => mockProvider),
      }))

      require('../index')

      expect(mockProvider.init).toHaveBeenCalled()
    })
  })
})
