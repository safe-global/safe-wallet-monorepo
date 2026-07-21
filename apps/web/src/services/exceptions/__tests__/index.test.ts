import { Errors, CodedException } from '..'
import { ErrorDomain, ErrorLayer, ErrorType } from '@safe-global/utils/services/exceptions/errorTaxonomy'

const defaultPublicIsProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION
describe('CodedException', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_IS_PRODUCTION = 'false'
    jest.resetModules()
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_IS_PRODUCTION = defaultPublicIsProduction
    jest.restoreAllMocks()
  })

  it('throws an error if code is not found', () => {
    expect(Errors.___0).toBe('0: No such error code')

    expect(() => {
      new CodedException('weird error' as any)
    }).toThrow('Code 0: No such error code (weird error)')
  })

  it('creates an error', () => {
    const err = new CodedException(Errors._100)
    expect(err.message).toBe('Code 100: Invalid input in the address field')
    expect(err.code).toBe(100)
    expect(err.content).toBe(Errors._100)
  })

  it('creates an error with an extra message from a string', () => {
    const err = new CodedException(Errors._100, '0x123')
    expect(err.message).toBe('Code 100: Invalid input in the address field (0x123)')
    expect(err.code).toBe(100)
    expect(err.content).toBe(Errors._100)
  })

  it('creates an error with an extra message from an Error instance', () => {
    const err = new CodedException(Errors._100, new Error('0x123'))
    expect(err.message).toBe('Code 100: Invalid input in the address field (0x123)')
    expect(err.code).toBe(100)
    expect(err.content).toBe(Errors._100)
  })

  it('creates an error with an extra message from an object', () => {
    const err = new CodedException(Errors._100, { secretKey: '0x123' })
    expect(err.message).toBe('Code 100: Invalid input in the address field (Non-Error object of type: object)')
    expect(err.code).toBe(100)
    expect(err.content).toBe(Errors._100)

    // Verify it does NOT expose object contents (security test)
    expect(err.message).not.toContain('0x123')
    expect(err.message).not.toContain('secretKey')
  })

  it('creates an error with an extra message', () => {
    const err = new CodedException(Errors._901, 'getSafeBalance: Server responded with 429 Too Many Requests')
    expect(err.message).toBe(
      'Code 901: Error processing Safe Apps SDK request (getSafeBalance: Server responded with 429 Too Many Requests)',
    )
    expect(err.code).toBe(901)
  })

  describe('Logging (warn level)', () => {
    it('logs caught exceptions to console.warn, not console.error', async () => {
      const { logError } = await import('..')

      const err = logError(Errors._100, '123')
      expect(err.message).toBe('Code 100: Invalid input in the address field (123)')
      expect(console.warn).toHaveBeenCalledWith(err)
      expect(console.error).not.toHaveBeenCalled()
    })

    it('public log method routes through console.warn', () => {
      const err = new CodedException(Errors._601)
      expect(err.message).toBe('Code 601: Error fetching balances')
      expect(console.warn).not.toHaveBeenCalled()
      err.log()
      expect(console.warn).toHaveBeenCalledWith(err)
    })

    it('logs only the message on prod', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const { logError, Errors } = await import('..')

      logError(Errors._100)
      expect(console.warn).toHaveBeenCalledWith('Code 100: Invalid input in the address field')
    })

    it('forwards to logger.warn in production (NOT addError)', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const mockWarn = jest.fn()
      const mockError = jest.fn()
      jest.doMock('@/services/observability', () => ({
        __esModule: true,
        ...jest.requireActual('@/services/observability'),
        logger: { info: jest.fn(), warn: mockWarn, error: mockError, debug: jest.fn() },
      }))

      const { logError, Errors } = await import('..')

      logError(Errors._601, 'rpc down')
      expect(mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('601'),
        expect.objectContaining({
          code: 601,
          error_domain: ErrorDomain.DATA_LOADING,
          error_type: ErrorType.FETCH_FAILED,
          error_layer: ErrorLayer.OFF_CHAIN,
        }),
      )
      expect(mockError).not.toHaveBeenCalled()
    })

    it('does not forward to logger in non-production envs', async () => {
      const mockWarn = jest.fn()
      jest.doMock('@/services/observability', () => ({
        __esModule: true,
        ...jest.requireActual('@/services/observability'),
        logger: { info: jest.fn(), warn: mockWarn, error: jest.fn(), debug: jest.fn() },
      }))

      const { logError, Errors } = await import('..')

      logError(Errors._601)
      expect(mockWarn).not.toHaveBeenCalled()
    })
  })

  describe('Tracking (error level)', () => {
    it('logs at error level AND forwards to captureException on production', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'

      const mockCaptureException = jest.fn()
      const mockError = jest.fn()

      jest.doMock('@/services/observability', () => ({
        __esModule: true,
        ...jest.requireActual('@/services/observability'),
        captureException: mockCaptureException,
        logger: { info: jest.fn(), warn: jest.fn(), error: mockError, debug: jest.fn() },
      }))

      const { trackError, Errors } = await import('..')

      const err = trackError(Errors._100)
      expect(mockCaptureException).toHaveBeenCalledWith(
        err,
        expect.objectContaining({
          code: 100,
          error_domain: ErrorDomain.TX_CREATION,
          error_type: ErrorType.ADDRESS_INVALID,
          error_layer: ErrorLayer.OFF_CHAIN,
        }),
      )
      expect(mockError).toHaveBeenCalledWith(
        err.message,
        expect.objectContaining({
          code: 100,
          error_domain: ErrorDomain.TX_CREATION,
          error_type: ErrorType.ADDRESS_INVALID,
        }),
      )
      expect(console.error).toHaveBeenCalledWith(err.message)
    })

    it('tags the Datadog error with the refined domain/type/layer (on-chain revert)', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const mockCaptureException = jest.fn()
      jest.doMock('@/services/observability', () => ({
        __esModule: true,
        ...jest.requireActual('@/services/observability'),
        captureException: mockCaptureException,
        logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
      }))

      const { trackError, Errors } = await import('..')

      trackError(Errors._804, 'execution reverted GS013')
      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          error_domain: ErrorDomain.TX_EXECUTION,
          error_type: ErrorType.ON_CHAIN_REVERT,
          error_layer: ErrorLayer.ON_CHAIN,
        }),
      )
    })

    it('does not track in non-production envs', async () => {
      const mockCaptureException = jest.fn()
      jest.doMock('@/services/observability', () => ({
        __esModule: true,
        ...jest.requireActual('@/services/observability'),
        captureException: mockCaptureException,
      }))

      const { trackError, Errors } = await import('..')

      const err = trackError(Errors._100)
      expect(mockCaptureException).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(err)
    })
  })

  describe('Error Surfaced analytics', () => {
    it('emits a user-facing Error Surfaced event to the registered handler when tracking in production', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const handler = jest.fn()
      const { trackError, setErrorSurfacedHandler, Errors } = await import('..')
      setErrorSurfacedHandler(handler)

      trackError(Errors._804, 'rpc down')
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ code: 804, isUserFacing: true }))
    })

    it('emits a non-user-facing Error Surfaced event to the registered handler when logging in production', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const handler = jest.fn()
      const { logError, setErrorSurfacedHandler, Errors } = await import('..')
      setErrorSurfacedHandler(handler)

      logError(Errors._601)
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ code: 601, isUserFacing: false }))
    })

    it('does not emit Error Surfaced in non-production envs', async () => {
      const handler = jest.fn()
      const { trackError, logError, setErrorSurfacedHandler, Errors } = await import('..')
      setErrorSurfacedHandler(handler)

      trackError(Errors._804)
      logError(Errors._601)
      expect(handler).not.toHaveBeenCalled()
    })

    it('forwards call-site context (e.g. txHash) to the handler', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const handler = jest.fn()
      const { trackError, setErrorSurfacedHandler, Errors } = await import('..')
      setErrorSurfacedHandler(handler)

      trackError(Errors._814, 'speed up failed', { txHash: '0xdeadbeef' })
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ context: { txHash: '0xdeadbeef' } }))
    })

    it('does not throw when no handler is registered', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const { trackError, Errors } = await import('..')

      expect(() => trackError(Errors._804)).not.toThrow()
    })
  })
})
