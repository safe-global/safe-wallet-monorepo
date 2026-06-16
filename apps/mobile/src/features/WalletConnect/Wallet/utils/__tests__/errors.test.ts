import { getPairErrorMessage, isBenignWalletKitError, logWalletKitError } from '../errors'

describe('isBenignWalletKitError', () => {
  it('returns true for known benign relay-replay errors', () => {
    expect(isBenignWalletKitError(new Error('No matching key: abc'))).toBe(true)
    expect(isBenignWalletKitError(new Error("session topic doesn't exist"))).toBe(true)
    expect(isBenignWalletKitError('pairing topic does not exist')).toBe(true)
  })

  it('returns false for real errors', () => {
    expect(isBenignWalletKitError(new Error('respondSessionRequest failed'))).toBe(false)
    expect(isBenignWalletKitError(undefined)).toBe(false)
  })
})

describe('getPairErrorMessage', () => {
  it('maps expired-URI errors to an actionable message', () => {
    expect(getPairErrorMessage(new Error('Pairing URI expired'))).toMatch(/expired/i)
  })

  it('does not leak raw WalletKit messages for unknown errors', () => {
    const message = getPairErrorMessage(new Error("No matching key. session topic doesn't exist"))
    expect(message).not.toContain('No matching key')
    expect(message).toBe('Failed to pair. Please try again.')
  })

  it('falls back to the generic message for non-Error values', () => {
    expect(getPairErrorMessage(undefined)).toBe('Failed to pair. Please try again.')
  })
})

describe('logWalletKitError', () => {
  afterEach(() => jest.restoreAllMocks())

  it('logs benign errors at console.log level', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    logWalletKitError('ctx', new Error('No matching key'))
    expect(log).toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  it('logs real errors at console.error level', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    logWalletKitError('ctx', new Error('boom'))
    expect(error).toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })
})
