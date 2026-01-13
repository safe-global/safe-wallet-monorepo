import { SentryProvider } from '../sentry'

describe('SentryProvider', () => {
  it('should have correct name', () => {
    const provider = new SentryProvider()
    expect(provider.name).toBe('Sentry')
  })

  it('should not throw when initializing', async () => {
    const provider = new SentryProvider()
    await expect(provider.init()).resolves.not.toThrow()
  })

  it('should return logger with all methods', () => {
    const provider = new SentryProvider()
    const logger = provider.getLogger()

    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('should not throw when calling logger methods before initialization', () => {
    const provider = new SentryProvider()
    const logger = provider.getLogger()

    expect(() => logger.info('test')).not.toThrow()
    expect(() => logger.warn('test')).not.toThrow()
    expect(() => logger.error('test')).not.toThrow()
    expect(() => logger.debug('test')).not.toThrow()
  })

  it('should not throw when calling captureException before initialization', () => {
    const provider = new SentryProvider()
    const error = new Error('test error')

    expect(() => provider.captureException(error)).not.toThrow()
  })

  it('should handle logger methods with context', () => {
    const provider = new SentryProvider()
    const logger = provider.getLogger()
    const context = { key: 'value' }

    expect(() => logger.info('test', context)).not.toThrow()
    expect(() => logger.warn('test', context)).not.toThrow()
    expect(() => logger.error('test', context)).not.toThrow()
    expect(() => logger.debug('test', context)).not.toThrow()
  })

  it('should handle captureException with context', () => {
    const provider = new SentryProvider()
    const error = new Error('test error')
    const context = { componentStack: 'test' }

    expect(() => provider.captureException(error, context)).not.toThrow()
  })

  it('should handle multiple initializations gracefully', async () => {
    const provider = new SentryProvider()
    await expect(provider.init()).resolves.not.toThrow()
    await expect(provider.init()).resolves.not.toThrow()
  })
})
