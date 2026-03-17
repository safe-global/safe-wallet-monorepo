import type * as ConstantsModule from '@/config/constants'

const mockAddAction = jest.fn()
const mockAddError = jest.fn()
const mockInit = jest.fn()
const mockGetInitConfiguration = jest.fn()

jest.mock('@datadog/browser-rum', () => ({
  datadogRum: {
    init: (...args: unknown[]) => mockInit(...args),
    addAction: (...args: unknown[]) => mockAddAction(...args),
    addError: (...args: unknown[]) => mockAddError(...args),
    getInitConfiguration: (...args: unknown[]) => mockGetInitConfiguration(...args),
  },
}))

interface DatadogProviderInstance {
  name: string
  init: () => Promise<void>
  getLogger: () => {
    info: (message: string, context?: Record<string, unknown>) => void
    warn: (message: string, context?: Record<string, unknown>) => void
    error: (message: string, context?: Record<string, unknown>) => void
    debug: (message: string, context?: Record<string, unknown>) => void
  }
  captureException: (error: Error, context?: Record<string, unknown>) => void
}

type DatadogProviderConstructor = new () => DatadogProviderInstance

describe('DatadogProvider', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockDisabledDatadogConstants = (): void => {
    jest.doMock('@/config/constants', () => {
      const actualConstants = jest.requireActual<typeof ConstantsModule>('@/config/constants')

      return {
        ...actualConstants,
        DATADOG_RUM_APPLICATION_ID: '',
        DATADOG_RUM_CLIENT_TOKEN: '',
      }
    })
  }

  const mockEnabledDatadogConstants = (): void => {
    jest.doMock('@/config/constants', () => {
      const actualConstants = jest.requireActual<typeof ConstantsModule>('@/config/constants')

      return {
        ...actualConstants,
        DATADOG_RUM_APPLICATION_ID: 'test-app-id',
        DATADOG_RUM_CLIENT_TOKEN: 'test-client-token',
      }
    })
  }

  const importProvider = async () => {
    const { DatadogProvider } = await import('../datadog')
    return DatadogProvider as unknown as DatadogProviderConstructor
  }

  const createInitializedProvider = async (): Promise<DatadogProviderInstance> => {
    mockEnabledDatadogConstants()
    mockGetInitConfiguration.mockReturnValue(undefined)
    const Provider = await importProvider()
    const provider = new Provider()
    await provider.init()
    return provider
  }

  it('should have correct name', () => {
    mockDisabledDatadogConstants()
    const Provider = require('../datadog').DatadogProvider as DatadogProviderConstructor
    const provider = new Provider()
    expect(provider.name).toBe('Datadog')
  })

  it('should not throw when initializing', async () => {
    mockDisabledDatadogConstants()
    const Provider = await importProvider()
    const provider = new Provider()
    await expect(provider.init()).resolves.not.toThrow()
  })

  it('should return logger with all methods', () => {
    mockDisabledDatadogConstants()
    const Provider = require('../datadog').DatadogProvider as DatadogProviderConstructor
    const provider = new Provider()
    const logger = provider.getLogger()

    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('should not throw when calling logger methods before initialization', () => {
    mockDisabledDatadogConstants()
    const Provider = require('../datadog').DatadogProvider as DatadogProviderConstructor
    const provider = new Provider()
    const logger = provider.getLogger()

    expect(() => logger.info('test')).not.toThrow()
    expect(() => logger.warn('test')).not.toThrow()
    expect(() => logger.error('test')).not.toThrow()
    expect(() => logger.debug('test')).not.toThrow()
  })

  it('should not call datadogRum methods before initialization', () => {
    mockDisabledDatadogConstants()
    const Provider = require('../datadog').DatadogProvider as DatadogProviderConstructor
    const provider = new Provider()
    const logger = provider.getLogger()

    logger.info('test')
    logger.warn('test')
    logger.error('test')
    logger.debug('test')
    provider.captureException(new Error('test'))

    expect(mockAddAction).not.toHaveBeenCalled()
    expect(mockAddError).not.toHaveBeenCalled()
  })

  it('should not throw when calling captureException before initialization', () => {
    mockDisabledDatadogConstants()
    const Provider = require('../datadog').DatadogProvider as DatadogProviderConstructor
    const provider = new Provider()
    const error = new Error('test error')

    expect(() => provider.captureException(error)).not.toThrow()
  })

  it('should handle logger methods with context', () => {
    mockDisabledDatadogConstants()
    const Provider = require('../datadog').DatadogProvider as DatadogProviderConstructor
    const provider = new Provider()
    const logger = provider.getLogger()
    const context = { key: 'value' }

    expect(() => logger.info('test', context)).not.toThrow()
    expect(() => logger.warn('test', context)).not.toThrow()
    expect(() => logger.error('test', context)).not.toThrow()
    expect(() => logger.debug('test', context)).not.toThrow()
  })

  it('should handle captureException with context', () => {
    mockDisabledDatadogConstants()
    const Provider = require('../datadog').DatadogProvider as DatadogProviderConstructor
    const provider = new Provider()
    const error = new Error('test error')
    const context = { componentStack: 'test' }

    expect(() => provider.captureException(error, context)).not.toThrow()
  })

  describe('after initialization', () => {
    it('should call addAction with level info for logger.info', async () => {
      const provider = await createInitializedProvider()
      const logger = provider.getLogger()

      logger.info('info message', { extra: 'data' })

      expect(mockAddAction).toHaveBeenCalledWith('info message', { level: 'info', extra: 'data' })
    })

    it('should call addAction with level warn for logger.warn', async () => {
      const provider = await createInitializedProvider()
      const logger = provider.getLogger()

      logger.warn('warn message', { extra: 'data' })

      expect(mockAddAction).toHaveBeenCalledWith('warn message', { level: 'warn', extra: 'data' })
    })

    it('should call addAction with level debug for logger.debug', async () => {
      const provider = await createInitializedProvider()
      const logger = provider.getLogger()

      logger.debug('debug message')

      expect(mockAddAction).toHaveBeenCalledWith('debug message', { level: 'debug' })
    })

    it('should call addError with Error object for logger.error', async () => {
      const provider = await createInitializedProvider()
      const logger = provider.getLogger()

      logger.error('error message', { extra: 'data' })

      expect(mockAddError).toHaveBeenCalledWith(expect.objectContaining({ message: 'error message' }), {
        extra: 'data',
      })
    })

    it('should call addError for captureException', async () => {
      const provider = await createInitializedProvider()
      const error = new Error('captured error')
      const context = { componentStack: 'test' }

      provider.captureException(error, context)

      expect(mockAddError).toHaveBeenCalledWith(error, context)
    })
  })
})
