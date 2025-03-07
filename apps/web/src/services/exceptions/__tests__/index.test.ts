import { Errors, CodedException } from '..'

const defaultPublicIsProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION
describe('CodedException', () => {
  beforeAll(() => {
    console.error = jest.fn()
  })

  beforeEach(() => {
    process.env.NEXT_PUBLIC_IS_PRODUCTION = 'false'
    jest.resetModules()
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_IS_PRODUCTION = defaultPublicIsProduction
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
    const err = new CodedException(Errors._100, { address: '0x123' })
    expect(err.message).toBe('Code 100: Invalid input in the address field ({"address":"0x123"})')
    expect(err.code).toBe(100)
    expect(err.content).toBe(Errors._100)
  })

  it('creates an error with an extra message', () => {
    const err = new CodedException(Errors._901, 'getSafeBalance: Server responded with 429 Too Many Requests')
    expect(err.message).toBe(
      'Code 901: Error processing Safe Apps SDK request (getSafeBalance: Server responded with 429 Too Many Requests)',
    )
    expect(err.code).toBe(901)
  })

  describe('Logging', () => {
    it('logs to the console', async () => {
      const { logError } = await import('..')

      const err = logError(Errors._100, '123')
      expect(err.message).toBe('Code 100: Invalid input in the address field (123)')
      expect(console.error).toHaveBeenCalledWith(err)
    })

    it('logs to the console via the public log method', () => {
      const err = new CodedException(Errors._601)
      expect(err.message).toBe('Code 601: Error fetching balances')
      expect(console.error).not.toHaveBeenCalled()
      err.log()
      expect(console.error).toHaveBeenCalledWith(err)
    })

    it('logs only the error message on prod', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
      const { logError, Errors } = await import('..')

      logError(Errors._100)
      expect(console.error).toHaveBeenCalledWith('Code 100: Invalid input in the address field')
    })
  })

  describe('Tracking', () => {
    beforeAll(() => {
      console.error = jest.fn()
    })

    beforeEach(() => {
      jest.resetModules()
      jest.clearAllMocks()
    })

    // I can't figure out a way to override the IS_PRODUCTION constant
    it('tracks using Sentry on production', async () => {
      process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'

      const mockSentryCaptureException = jest.fn()

      jest.doMock('@/services/sentry', () => ({
        __esModule: true,
        ...jest.requireActual('@/services/sentry'),
        sentryCaptureException: mockSentryCaptureException,
      }))

      const { trackError, Errors } = await import('..')

      const err = trackError(Errors._100)
      expect(mockSentryCaptureException).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(err.message)
    })

    it('does not track using Sentry in non-production envs', async () => {
      const mockSentryCaptureException = jest.fn()
      jest.doMock('@/services/sentry', () => ({
        __esModule: true,
        ...jest.requireActual('@/services/sentry'),
        sentryCaptureException: mockSentryCaptureException,
      }))

      const { trackError, Errors } = await import('..')

      const err = trackError(Errors._100)
      expect(mockSentryCaptureException).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(err)
    })
  })
})
