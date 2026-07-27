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

  const mockObservability = (captureError: jest.Mock, logger?: Record<string, jest.Mock>) => {
    jest.doMock('@/services/observability', () => ({
      __esModule: true,
      ...jest.requireActual('@/services/observability'),
      captureError,
      logger: logger ?? { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
    }))
  }

  describe('Tracking (error level)', () => {
    it('logs at error level AND reports a user-facing error to observability on production', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'

      const mockCaptureError = jest.fn()
      const mockError = jest.fn()
      mockObservability(mockCaptureError, { info: jest.fn(), warn: jest.fn(), error: mockError, debug: jest.fn() })

      const { trackError, Errors } = await import('..')

      const err = trackError(Errors._100)
      expect(mockCaptureError).toHaveBeenCalledWith(
        expect.objectContaining({
          error: err,
          isUserFacing: true,
          code: 100,
          tags: expect.objectContaining({
            code: 100,
            error_domain: ErrorDomain.TX_CREATION,
            error_type: ErrorType.ADDRESS_INVALID,
            error_layer: ErrorLayer.OFF_CHAIN,
          }),
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
      const mockCaptureError = jest.fn()
      mockObservability(mockCaptureError)

      const { trackError, Errors } = await import('..')

      trackError(Errors._804, 'execution reverted GS013')
      expect(mockCaptureError).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.objectContaining({
            error_domain: ErrorDomain.TX_EXECUTION,
            error_type: ErrorType.ON_CHAIN_REVERT,
            error_layer: ErrorLayer.ON_CHAIN,
          }),
        }),
      )
    })

    it('merges RPC endpoint context into the Datadog tags', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const mockCaptureError = jest.fn()
      const mockError = jest.fn()
      mockObservability(mockCaptureError, { info: jest.fn(), warn: jest.fn(), error: mockError, debug: jest.fn() })

      const { trackError, Errors } = await import('..')

      trackError(Errors._105, 'rpc down', { rpcEndpointKind: 'infura', rpcHost: 'mainnet.infura.io' })
      expect(mockCaptureError).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.objectContaining({
            code: 105,
            error_domain: ErrorDomain.RPC,
            error_type: ErrorType.RPC_ERROR,
            rpc_endpoint_kind: 'infura',
            rpc_host: 'mainnet.infura.io',
          }),
        }),
      )
      // The Datadog action (logger.error) carries the same facets
      expect(mockError).toHaveBeenCalledWith(
        expect.stringContaining('105'),
        expect.objectContaining({ rpc_endpoint_kind: 'infura', rpc_host: 'mainnet.infura.io' }),
      )
    })

    it('omits RPC tags when no endpoint context is provided', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const mockCaptureError = jest.fn()
      mockObservability(mockCaptureError)

      const { trackError, Errors } = await import('..')

      trackError(Errors._105, 'rpc down')
      const { tags } = mockCaptureError.mock.calls[0][0]
      expect(tags).not.toHaveProperty('rpc_endpoint_kind')
      expect(tags).not.toHaveProperty('rpc_host')
    })

    it('does not track in non-production envs', async () => {
      const mockCaptureError = jest.fn()
      mockObservability(mockCaptureError)

      const { trackError, Errors } = await import('..')

      const err = trackError(Errors._100)
      expect(mockCaptureError).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(err)
    })
  })

  describe('Error Surfaced analytics', () => {
    it('reports a user-facing error to observability when tracking in production', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const captureError = jest.fn()
      mockObservability(captureError)
      const { trackError, Errors } = await import('..')

      trackError(Errors._804, 'rpc down')
      expect(captureError).toHaveBeenCalledWith(expect.objectContaining({ code: 804, isUserFacing: true }))
    })

    it('reports a non-user-facing error to observability when logging in production', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const captureError = jest.fn()
      mockObservability(captureError)
      const { logError, Errors } = await import('..')

      logError(Errors._601)
      expect(captureError).toHaveBeenCalledWith(expect.objectContaining({ code: 601, isUserFacing: false }))
    })

    it('does not report an error in non-production envs', async () => {
      const captureError = jest.fn()
      mockObservability(captureError)
      const { trackError, logError, Errors } = await import('..')

      trackError(Errors._804)
      logError(Errors._601)
      expect(captureError).not.toHaveBeenCalled()
    })

    it('forwards call-site context (e.g. txHash) to observability', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const captureError = jest.fn()
      mockObservability(captureError)
      const { trackError, Errors } = await import('..')

      trackError(Errors._814, 'speed up failed', { txHash: '0xdeadbeef' })
      expect(captureError).toHaveBeenCalledWith(expect.objectContaining({ context: { txHash: '0xdeadbeef' } }))
    })
  })
})
