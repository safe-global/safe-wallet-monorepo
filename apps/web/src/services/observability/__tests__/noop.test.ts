import { NoOpProvider } from '../providers/noop'

describe('NoOpProvider', () => {
  it('should be a no-op implementation that never throws', () => {
    const provider = new NoOpProvider()
    const logger = provider.getLogger()

    expect(provider.name).toBe('NoOp')

    // Test that all operations are safe no-ops
    expect(() => provider.init()).not.toThrow()
    expect(() => provider.captureException(new Error('test'), { key: 'value' })).not.toThrow()
    expect(() => logger.info('test', { context: 'data' })).not.toThrow()
    expect(() => logger.warn('test')).not.toThrow()
    expect(() => logger.error('test')).not.toThrow()
    expect(() => logger.debug('test')).not.toThrow()
  })
})
