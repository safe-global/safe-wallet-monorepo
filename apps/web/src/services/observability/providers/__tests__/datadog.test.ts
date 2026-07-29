import type * as ConstantsModule from '@/config/constants'
import type { ObservedError } from '../../types'

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
  captureError: (error: ObservedError) => void
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
    provider.captureError({ error: new Error('test'), isUserFacing: true })

    expect(mockAddAction).not.toHaveBeenCalled()
    expect(mockAddError).not.toHaveBeenCalled()
  })

  it('should not throw when calling captureError before initialization', () => {
    mockDisabledDatadogConstants()
    const Provider = require('../datadog').DatadogProvider as DatadogProviderConstructor
    const provider = new Provider()
    const error = new Error('test error')

    expect(() => provider.captureError({ error, isUserFacing: true })).not.toThrow()
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

  it('should handle captureError with tags', () => {
    mockDisabledDatadogConstants()
    const Provider = require('../datadog').DatadogProvider as DatadogProviderConstructor
    const provider = new Provider()
    const error = new Error('test error')
    const tags = { componentStack: 'test' }

    expect(() => provider.captureError({ error, isUserFacing: true, tags })).not.toThrow()
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

    it('should call addError for a user-facing captureError', async () => {
      const provider = await createInitializedProvider()
      const error = new Error('captured error')
      const tags = { componentStack: 'test' }

      provider.captureError({ error, isUserFacing: true, tags })

      expect(mockAddError).toHaveBeenCalledWith(error, tags)
    })

    it('does not call addError for a non-user-facing captureError (kept off the SLO)', async () => {
      const provider = await createInitializedProvider()
      const error = new Error('background error')

      provider.captureError({ error, isUserFacing: false, tags: { code: 601 } })

      expect(mockAddError).not.toHaveBeenCalled()
    })
  })

  describe('filterRumEvent', () => {
    const buildErrorEvent = (overrides: Record<string, unknown> = {}): any => ({
      type: 'error',
      error: { message: 'something broke', stack: '', ...overrides },
    })

    it('passes non-error events through', async () => {
      const { filterRumEvent } = await import('../datadog')
      expect(filterRumEvent({ type: 'view' } as any, {} as any)).toBe(true)
      expect(filterRumEvent({ type: 'action' } as any, {} as any)).toBe(true)
      expect(filterRumEvent({ type: 'resource' } as any, {} as any)).toBe(true)
    })

    it('keeps application errors', async () => {
      const { filterRumEvent } = await import('../datadog')
      const event = buildErrorEvent({
        stack: 'at foo (https://app.safe.global/_next/static/chunks/main.js:1:1)',
      })
      expect(filterRumEvent(event, {} as any)).toBe(true)
    })

    it('drops errors whose stack points at a chrome extension', async () => {
      const { filterRumEvent } = await import('../datadog')
      const event = buildErrorEvent({
        stack: 'at wallet (chrome-extension://abcdefg/inject.js:12:5)',
      })
      expect(filterRumEvent(event, {} as any)).toBe(false)
    })

    it('drops errors whose stack points at a firefox extension', async () => {
      const { filterRumEvent } = await import('../datadog')
      const event = buildErrorEvent({
        stack: 'at provider (moz-extension://uuid/content.js:5:9)',
      })
      expect(filterRumEvent(event, {} as any)).toBe(false)
    })

    it('drops errors whose raw Error stack (from context) points at an extension', async () => {
      const { filterRumEvent } = await import('../datadog')
      const event = buildErrorEvent()
      const rawError = Object.assign(new Error('x'), { stack: 'safari-web-extension://abc/x.js:1:1' })
      expect(filterRumEvent(event, { error: rawError } as any)).toBe(false)
    })

    it('keeps errors when context.error is not an Error instance', async () => {
      const { filterRumEvent } = await import('../datadog')
      const event = buildErrorEvent({ stack: 'at foo (https://app.safe.global/x.js:1:1)' })
      expect(filterRumEvent(event, { error: 'some string' } as any)).toBe(true)
      expect(filterRumEvent(event, { error: undefined } as any)).toBe(true)
    })

    it('drops known browser noise messages', async () => {
      const { filterRumEvent } = await import('../datadog')
      for (const message of [
        'ResizeObserver loop completed with undelivered notifications',
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured with value: null',
        'Script error.',
      ]) {
        expect(filterRumEvent(buildErrorEvent({ message }), {} as any)).toBe(false)
      }
    })

    it('drops errors auto-captured from console.error (source=console)', async () => {
      const { filterRumEvent } = await import('../datadog')
      const event = buildErrorEvent({
        source: 'console',
        message: 'Failed to copy address: PermissionDenied',
        stack: 'at copy (https://app.safe.global/_next/static/chunks/main.js:1:1)',
      })
      expect(filterRumEvent(event, {} as any)).toBe(false)
    })

    it('drops errors auto-captured from the Browser Reporting API (source=report)', async () => {
      const { filterRumEvent } = await import('../datadog')
      const event = buildErrorEvent({
        source: 'report',
        message: "csp_violation: 'eval' blocked by 'script-src' directive",
      })
      expect(filterRumEvent(event, {} as any)).toBe(false)
    })

    it('keeps errors from user-impacting sources (unhandled exceptions, network, custom)', async () => {
      const { filterRumEvent } = await import('../datadog')
      for (const source of ['source', 'network', 'custom', undefined]) {
        const event = buildErrorEvent({
          source,
          message: 'Boom',
          stack: 'at handler (https://app.safe.global/_next/static/chunks/main.js:1:1)',
        })
        expect(filterRumEvent(event, {} as any)).toBe(true)
      }
    })
  })
})
