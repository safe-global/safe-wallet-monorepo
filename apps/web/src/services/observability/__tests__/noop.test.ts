import { NoOpProvider } from '../providers/noop'

describe('NoOpProvider', () => {
  let provider: NoOpProvider

  beforeEach(() => {
    provider = new NoOpProvider()
  })

  it('should have name "NoOp"', () => {
    expect(provider.name).toBe('NoOp')
  })

  it('should not throw when init is called', () => {
    expect(() => provider.init()).not.toThrow()
  })

  it('should return a logger with all methods', () => {
    const logger = provider.getLogger()

    expect(logger).toHaveProperty('info')
    expect(logger).toHaveProperty('warn')
    expect(logger).toHaveProperty('error')
    expect(logger).toHaveProperty('debug')
  })

  it('should not throw when logger methods are called', () => {
    const logger = provider.getLogger()

    expect(() => logger.info('test')).not.toThrow()
    expect(() => logger.warn('test')).not.toThrow()
    expect(() => logger.error('test')).not.toThrow()
    expect(() => logger.debug('test')).not.toThrow()
  })

  it('should not throw when captureException is called', () => {
    const error = new Error('test error')
    expect(() => provider.captureException(error)).not.toThrow()
  })

  it('should handle logger calls with context', () => {
    const logger = provider.getLogger()
    const context = { key: 'value' }

    expect(() => logger.info('test', context)).not.toThrow()
    expect(() => logger.error('test', context)).not.toThrow()
  })

  it('should handle captureException with context', () => {
    const error = new Error('test error')
    const context = { componentStack: 'test stack' }

    expect(() => provider.captureException(error, context)).not.toThrow()
  })
})
