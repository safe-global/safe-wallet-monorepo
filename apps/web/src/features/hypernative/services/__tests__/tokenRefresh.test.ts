import { getAuthCookieData, markRefreshAbandoned, setAuthCookie } from '../../store/cookieStorage'
import {
  getNextRefreshStep,
  getOAuthErrorCode,
  getRefreshDelayMs,
  MAX_TIMEOUT_DELAY_MS,
  REFRESH_MARGIN_MS,
  REFRESH_RETRY_DELAYS_MS,
  refreshAuthToken,
} from '../tokenRefresh'

const mockCookieJar = new Map<string, string>()

jest.mock('js-cookie', () => ({
  get: (key: string) => mockCookieJar.get(key),
  set: (key: string, value: string) => mockCookieJar.set(key, value),
  remove: (key: string) => mockCookieJar.delete(key),
}))

const rotatedTokens = {
  access_token: 'access-2',
  token_type: 'Bearer',
  expires_in: 300,
  refresh_token: 'refresh-2',
  refresh_expires_in: 2591700,
}

const startSession = () =>
  setAuthCookie({
    access_token: 'access-1',
    token_type: 'Bearer',
    expires_in: 30,
    refresh_token: 'refresh-1',
    refresh_expires_in: 2592000,
  })

const oauthError = (code: string) => ({ success: false, data: null, error: { error: code } })

describe('tokenRefresh', () => {
  beforeEach(() => {
    mockCookieJar.clear()
  })

  describe('getOAuthErrorCode', () => {
    it.each([
      ['a nested 4xx code', oauthError('invalid_grant'), 'invalid_grant'],
      ['a flat 5xx code', { success: false, data: {}, error: 'server_error' }, 'server_error'],
      ['an envelope without a code', { success: false, data: null }, undefined],
      ['a network failure', { message: 'Rejected' }, undefined],
      ['no value at all', undefined, undefined],
      ['a nested value that is not a string', { error: { error: 42 } }, undefined],
    ])('reads %s', (_label, rejection, expected) => {
      expect(getOAuthErrorCode(rejection)).toBe(expected)
    })
  })

  describe('getNextRefreshStep', () => {
    it.each(['refreshed', 'superseded', 'abandoned'] as const)('is done after %s', (outcome) => {
      expect(getNextRefreshStep(outcome, 0, true)).toEqual({ type: 'done' })
    })

    it('signs out after a terminal error', () => {
      expect(getNextRefreshStep('terminal', 0, true)).toEqual({ type: 'sign-out' })
    })

    it.each(REFRESH_RETRY_DELAYS_MS.map((delayMs, attempt) => [attempt, delayMs]))(
      'retries attempt %i after %i ms',
      (attempt, delayMs) => {
        expect(getNextRefreshStep('transient', attempt, true)).toEqual({ type: 'retry', delayMs })
      },
    )

    it('abandons the token when the retries run out online', () => {
      expect(getNextRefreshStep('transient', REFRESH_RETRY_DELAYS_MS.length, true)).toEqual({ type: 'abandon' })
    })

    it('waits for the network when the retries run out offline', () => {
      expect(getNextRefreshStep('transient', REFRESH_RETRY_DELAYS_MS.length, false)).toEqual({
        type: 'wait-for-online',
      })
    })
  })

  describe('getRefreshDelayMs', () => {
    const now = 1_000_000

    it('is due one margin before the access token expires', () => {
      expect(getRefreshDelayMs(now + REFRESH_MARGIN_MS + 5_000, now)).toBe(5_000)
    })

    it('is due at once inside the margin', () => {
      expect(getRefreshDelayMs(now + 1_000, now)).toBe(0)
    })

    it('never exceeds what setTimeout accepts', () => {
      expect(getRefreshDelayMs(now + 40 * 24 * 60 * 60 * 1000, now)).toBe(MAX_TIMEOUT_DELAY_MS)
    })
  })

  describe('refreshAuthToken', () => {
    it('stores the rotated token pair', async () => {
      startSession()
      const exchange = jest.fn().mockResolvedValue(rotatedTokens)

      await expect(refreshAuthToken('refresh-1', exchange)).resolves.toBe('refreshed')

      expect(exchange).toHaveBeenCalledWith('refresh-1')
      expect(getAuthCookieData()).toMatchObject({ token: 'access-2', refreshToken: 'refresh-2' })
    })

    it('does not send a token that another tab already rotated', async () => {
      setAuthCookie({ ...rotatedTokens })
      const exchange = jest.fn()

      await expect(refreshAuthToken('refresh-1', exchange)).resolves.toBe('superseded')

      expect(exchange).not.toHaveBeenCalled()
    })

    it('does not send a token after sign-out', async () => {
      const exchange = jest.fn()

      await expect(refreshAuthToken('refresh-1', exchange)).resolves.toBe('superseded')

      expect(exchange).not.toHaveBeenCalled()
    })

    it('never sends an abandoned token', async () => {
      startSession()
      markRefreshAbandoned('refresh-1')
      const exchange = jest.fn()

      await expect(refreshAuthToken('refresh-1', exchange)).resolves.toBe('abandoned')

      expect(exchange).not.toHaveBeenCalled()
    })

    it.each(['invalid_grant', 'invalid_client', 'unsupported_grant_type', 'invalid_request'])(
      'reports %s as terminal',
      async (code) => {
        startSession()

        await expect(refreshAuthToken('refresh-1', jest.fn().mockRejectedValue(oauthError(code)))).resolves.toBe(
          'terminal',
        )
      },
    )

    it('reports a terminal code that arrives flat', async () => {
      startSession()
      const exchange = jest.fn().mockRejectedValue({ success: false, data: null, error: 'invalid_grant' })

      await expect(refreshAuthToken('refresh-1', exchange)).resolves.toBe('terminal')
    })

    it.each([
      ['a network failure', { message: 'Rejected' }],
      ['a 5xx', { success: false, data: {}, error: 'server_error' }],
      ['a free-text validation message', { success: false, data: null, error: 'refresh_token must be a string' }],
    ])('reports %s as transient and keeps the cookie', async (_label, rejection) => {
      startSession()

      await expect(refreshAuthToken('refresh-1', jest.fn().mockRejectedValue(rejection))).resolves.toBe('transient')

      expect(getAuthCookieData()).toMatchObject({ token: 'access-1', refreshToken: 'refresh-1' })
    })

    it('sends the token once when two tabs refresh at the same time', async () => {
      let queue: Promise<unknown> = Promise.resolve()
      Object.defineProperty(navigator, 'locks', {
        configurable: true,
        value: {
          request: (_name: string, callback: () => Promise<unknown>) => {
            const run = queue.then(callback)
            queue = run.catch(() => undefined)
            return run
          },
        },
      })
      startSession()
      const exchange = jest.fn().mockResolvedValue(rotatedTokens)

      const outcomes = await Promise.all([
        refreshAuthToken('refresh-1', exchange),
        refreshAuthToken('refresh-1', exchange),
      ])

      expect(outcomes).toEqual(['refreshed', 'superseded'])
      expect(exchange).toHaveBeenCalledTimes(1)

      delete (navigator as { locks?: unknown }).locks
    })
  })
})
