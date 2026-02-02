import type * as ConstantsModule from '@/config/constants'

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
        DATADOG_FORCE_ENABLE: false,
        DATADOG_CLIENT_TOKEN: '',
        DATADOG_RUM_APPLICATION_ID: '',
        DATADOG_RUM_CLIENT_TOKEN: '',
      }
    })
  }

  const importProvider = async () => {
    const { DatadogProvider } = await import('../datadog')
    return DatadogProvider as unknown as DatadogProviderConstructor
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
})
