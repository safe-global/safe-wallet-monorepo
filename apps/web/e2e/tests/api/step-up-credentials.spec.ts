/**
 * Step-up credentials and session helpers — pure, no browser. Env is passed explicitly; process.env is never mutated.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { getElevationWindowSeconds, getStepUpCredentials } from '../../src/data/step-up-credentials'
import { isSessionAlive } from '../../src/fixtures/step-up'

const REQUIRED = { STEP_UP_EMAIL: 'qa+step-up@example.com', STEP_UP_TOTP_SECRET: 'GEZDGNBVGY3TQOJQ' }
const KEY = `0x${'4'.repeat(64)}`
const SPACE_ID = '00000000-0000-4000-8000-000000000001'

test.describe('Step-up credentials', { tag: '@api' }, () => {
  test('requires the email and the authenticator secret', () => {
    expect(() => getStepUpCredentials({})).toThrow('Set STEP_UP_EMAIL and STEP_UP_TOTP_SECRET')
    expect(() => getStepUpCredentials({ STEP_UP_EMAIL: REQUIRED.STEP_UP_EMAIL })).toThrow('Set STEP_UP_EMAIL')
  })

  test('reads the optional wallets, code file and Workspace', () => {
    const credentials = getStepUpCredentials({
      ...REQUIRED,
      STEP_UP_ADMIN_KEY: KEY,
      STEP_UP_MEMBER_KEY: ` ${KEY} `,
      STEP_UP_EMAIL_CODE_FILE: '/tmp/code',
      STEP_UP_SPACE_ID: SPACE_ID,
    })

    expect(credentials).toEqual({
      email: REQUIRED.STEP_UP_EMAIL,
      totpSecret: REQUIRED.STEP_UP_TOTP_SECRET,
      adminKey: KEY,
      memberKey: KEY,
      emailCodeFile: '/tmp/code',
      spaceId: SPACE_ID,
    })
  })

  test('leaves unset optional values undefined', () => {
    const credentials = getStepUpCredentials({ ...REQUIRED, STEP_UP_ADMIN_KEY: '  ' })
    expect(credentials.adminKey).toBeUndefined()
    expect(credentials.spaceId).toBeUndefined()
  })

  test('rejects malformed values', () => {
    expect(() => getStepUpCredentials({ ...REQUIRED, STEP_UP_TOTP_SECRET: 'secret-1' })).toThrow(
      'STEP_UP_TOTP_SECRET has an invalid format',
    )
    expect(() => getStepUpCredentials({ ...REQUIRED, STEP_UP_ADMIN_KEY: '0x1234' })).toThrow(
      'STEP_UP_ADMIN_KEY has an invalid format',
    )
    expect(() => getStepUpCredentials({ ...REQUIRED, STEP_UP_SPACE_ID: '42' })).toThrow(
      'STEP_UP_SPACE_ID has an invalid format',
    )
  })

  test('defaults the elevation window to 60 seconds and validates overrides', () => {
    expect(getElevationWindowSeconds(undefined)).toBe(60)
    expect(getElevationWindowSeconds('1800')).toBe(1800)
    expect(() => getElevationWindowSeconds('0')).toThrow('positive integer')
  })
})

test.describe('Saved step-up session', { tag: '@api' }, () => {
  const NOW = 1_800_000_000
  const cookie = (name: string, domain: string, expires: number) => ({
    name,
    domain,
    expires,
    value: 'x',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'None' as const,
  })
  const state = (cgwExpires: number, auth0Expires: number) => ({
    cookies: [
      cookie('access_token', 'safe-client.staging.5afe.dev', cgwExpires),
      cookie('auth0', 'safe-devstaging.eu.auth0.com', auth0Expires),
    ],
    origins: [],
  })

  test('is alive while both sessions outlive half an hour', () => {
    expect(isSessionAlive(state(NOW + 3600, NOW + 7200), NOW)).toBe(true)
  })

  test('needs a new sign-in when either session is about to expire', () => {
    expect(isSessionAlive(state(NOW + 60, NOW + 7200), NOW)).toBe(false)
    expect(isSessionAlive(state(NOW + 3600, NOW + 60), NOW)).toBe(false)
    expect(isSessionAlive({ cookies: [], origins: [] }, NOW)).toBe(false)
  })
})
