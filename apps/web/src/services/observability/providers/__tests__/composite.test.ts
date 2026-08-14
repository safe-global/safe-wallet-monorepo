import { CompositeProvider } from '../composite'
import type { IObservabilityProvider, ILogger, ObservedError } from '../../types'

describe('CompositeProvider', () => {
  const createMockProvider = (name: string): IObservabilityProvider => {
    const mockLogger: ILogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }

    return {
      name,
      init: jest.fn().mockResolvedValue(undefined),
      getLogger: jest.fn().mockReturnValue(mockLogger),
      captureError: jest.fn(),
    }
  }

  const observedError: ObservedError = { error: new Error('Code 804: revert'), isUserFacing: true, code: 804 }

  it('should initialize all providers', async () => {
    const provider1 = createMockProvider('Provider1')
    const provider2 = createMockProvider('Provider2')
    const composite = new CompositeProvider([provider1, provider2])

    await composite.init()

    expect(provider1.init).toHaveBeenCalled()
    expect(provider2.init).toHaveBeenCalled()
  })

  it('should call logger methods on all providers', () => {
    const provider1 = createMockProvider('Provider1')
    const provider2 = createMockProvider('Provider2')
    const composite = new CompositeProvider([provider1, provider2])

    const logger = composite.getLogger()
    const logger1 = provider1.getLogger()
    const logger2 = provider2.getLogger()

    logger.info('test message', { key: 'value' })

    expect(logger1.info).toHaveBeenCalledWith('test message', { key: 'value' })
    expect(logger2.info).toHaveBeenCalledWith('test message', { key: 'value' })
  })

  it('should call captureError on all providers', () => {
    const provider1 = createMockProvider('Provider1')
    const provider2 = createMockProvider('Provider2')
    const composite = new CompositeProvider([provider1, provider2])

    composite.captureError(observedError)

    expect(provider1.captureError).toHaveBeenCalledWith(observedError)
    expect(provider2.captureError).toHaveBeenCalledWith(observedError)
  })

  it('should continue if one provider throws during logger call', () => {
    const provider1 = createMockProvider('Provider1')
    const provider2 = createMockProvider('Provider2')

    const logger1 = provider1.getLogger()
    const logger2 = provider2.getLogger()

    ;(logger1.error as jest.Mock).mockImplementation(() => {
      throw new Error('Provider1 error')
    })

    const composite = new CompositeProvider([provider1, provider2])
    const logger = composite.getLogger()

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => logger.error('test')).not.toThrow()
    expect(logger2.error).toHaveBeenCalledWith('test', undefined)

    consoleErrorSpy.mockRestore()
  })

  it('should continue if one provider throws during captureError', () => {
    const provider1 = createMockProvider('Provider1')
    const provider2 = createMockProvider('Provider2')

    ;(provider1.captureError as jest.Mock).mockImplementation(() => {
      throw new Error('Provider1 error')
    })

    const composite = new CompositeProvider([provider1, provider2])
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => composite.captureError(observedError)).not.toThrow()
    expect(provider2.captureError).toHaveBeenCalledWith(observedError)

    consoleErrorSpy.mockRestore()
  })

  it('should handle initialization failures gracefully', async () => {
    const provider1 = createMockProvider('Provider1')
    const provider2 = createMockProvider('Provider2')

    ;(provider1.init as jest.Mock).mockRejectedValue(new Error('Init failed'))

    const composite = new CompositeProvider([provider1, provider2])

    await expect(composite.init()).resolves.not.toThrow()
    expect(provider2.init).toHaveBeenCalled()
  })

  it('should call all logger methods correctly', () => {
    const provider1 = createMockProvider('Provider1')
    const provider2 = createMockProvider('Provider2')
    const composite = new CompositeProvider([provider1, provider2])

    const logger = composite.getLogger()
    const logger1 = provider1.getLogger()
    const logger2 = provider2.getLogger()

    logger.warn('warning')
    logger.debug('debug')

    expect(logger1.warn).toHaveBeenCalledWith('warning', undefined)
    expect(logger2.warn).toHaveBeenCalledWith('warning', undefined)
    expect(logger1.debug).toHaveBeenCalledWith('debug', undefined)
    expect(logger2.debug).toHaveBeenCalledWith('debug', undefined)
  })
})
