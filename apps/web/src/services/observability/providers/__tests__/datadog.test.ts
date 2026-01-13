import { DatadogProvider } from '../datadog'
import type * as ConstantsModule from '@/config/constants'

describe('DatadogProvider', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should have correct name', () => {
    const provider = new DatadogProvider()
    expect(provider.name).toBe('Datadog')
  })

  it('should not throw when initializing', async () => {
    const provider = new DatadogProvider()
    await expect(provider.init()).resolves.not.toThrow()
  })

  it('should return logger with all methods', () => {
    const provider = new DatadogProvider()
    const logger = provider.getLogger()

    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('should not throw when calling logger methods before initialization', () => {
    const provider = new DatadogProvider()
    const logger = provider.getLogger()

    expect(() => logger.info('test')).not.toThrow()
    expect(() => logger.warn('test')).not.toThrow()
    expect(() => logger.error('test')).not.toThrow()
    expect(() => logger.debug('test')).not.toThrow()
  })

  it('should not throw when calling captureException before initialization', () => {
    const provider = new DatadogProvider()
    const error = new Error('test error')

    expect(() => provider.captureException(error)).not.toThrow()
  })

  it('should handle logger methods with context', () => {
    const provider = new DatadogProvider()
    const logger = provider.getLogger()
    const context = { key: 'value' }

    expect(() => logger.info('test', context)).not.toThrow()
    expect(() => logger.warn('test', context)).not.toThrow()
    expect(() => logger.error('test', context)).not.toThrow()
    expect(() => logger.debug('test', context)).not.toThrow()
  })

  it('should handle captureException with context', () => {
    const provider = new DatadogProvider()
    const error = new Error('test error')
    const context = { componentStack: 'test' }

    expect(() => provider.captureException(error, context)).not.toThrow()
  })

  it('should initialize independently when Logs or RUM packages fail', async () => {
    jest.resetModules()

    const logsInit = jest.fn(() => {
      throw new Error('Logs init failed')
    })
    const rumInit = jest.fn()

    jest.doMock(
      '@datadog/browser-logs',
      () => ({
        datadogLogs: {
          init: logsInit,
          logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      }),
      { virtual: true },
    )

    jest.doMock(
      '@datadog/browser-rum',
      () => ({
        datadogRum: {
          init: rumInit,
          addError: jest.fn(),
          setGlobalContextProperty: jest.fn(),
        },
      }),
      { virtual: true },
    )

    jest.doMock('@/config/constants', () => {
      const actualConstants = jest.requireActual<typeof ConstantsModule>('@/config/constants')

      return {
        ...actualConstants,
        DATADOG_FORCE_ENABLE: true,
        DATADOG_CLIENT_TOKEN: 'test-client-token',
        DATADOG_RUM_APPLICATION_ID: 'test-app-id',
        DATADOG_RUM_CLIENT_TOKEN: 'test-rum-token',
      }
    })

    const { DatadogProvider: EnabledDatadogProvider } = await import('../datadog')
    const provider = new EnabledDatadogProvider()

    await provider.init()

    expect(console.warn).toHaveBeenCalled()
    expect(rumInit).toHaveBeenCalled()
  })
})
