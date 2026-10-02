/**
 * Step-up credentials parser tests — pure, no browser. Raw JSON is passed explicitly; process.env is never mutated.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { getElevationWindowSeconds, getStepUpCredentials } from '../../src/data/step-up-credentials'

const STORAGE_STATE = Buffer.from(JSON.stringify({ cookies: [], origins: [] })).toString('base64')
const SPACE_ID = '00000000-0000-4000-8000-000000000001'
const OIDC = { storageState: STORAGE_STATE, totpSecret: 'GEZDGNBVGY3TQOJQ', spaceId: SPACE_ID }
const SIWE = { privateKey: `0x${'4'.repeat(64)}`, spaceId: SPACE_ID }

test.describe('Step-up credentials parser', { tag: '@api' }, () => {
  test('returns no identities when the variable is unset or empty', () => {
    expect(getStepUpCredentials('')).toEqual({})
    expect(getStepUpCredentials('   ')).toEqual({})
  })

  test('parses both identities and decodes the storage state', () => {
    const credentials = getStepUpCredentials(JSON.stringify({ oidc: OIDC, siwe: SIWE }))

    expect(credentials.oidc).toEqual({
      storageState: { cookies: [], origins: [] },
      totpSecret: 'GEZDGNBVGY3TQOJQ',
      spaceId: SPACE_ID,
    })
    expect(credentials.siwe).toEqual(SIWE)
  })

  test('accepts a single identity', () => {
    expect(getStepUpCredentials(JSON.stringify({ siwe: SIWE })).oidc).toBeUndefined()
  })

  test('rejects malformed JSON', () => {
    expect(() => getStepUpCredentials('{not json')).toThrow('Failed to parse E2E_STEP_UP_CREDENTIALS')
  })

  test('rejects a storage state that is not base64 JSON', () => {
    const raw = JSON.stringify({ oidc: { ...OIDC, storageState: 'not-a-state' } })
    expect(() => getStepUpCredentials(raw)).toThrow('oidc.storageState must be base64-encoded JSON')
  })

  test('rejects a TOTP secret that is not base32', () => {
    const raw = JSON.stringify({ oidc: { ...OIDC, totpSecret: 'secret-1' } })
    expect(() => getStepUpCredentials(raw)).toThrow('oidc.totpSecret has an invalid format')
  })

  test('rejects a malformed private key', () => {
    const raw = JSON.stringify({ siwe: { ...SIWE, privateKey: '0x1234' } })
    expect(() => getStepUpCredentials(raw)).toThrow('siwe.privateKey has an invalid format')
  })

  test('rejects a Workspace id that is not a UUID', () => {
    const raw = JSON.stringify({ siwe: { ...SIWE, spaceId: '42' } })
    expect(() => getStepUpCredentials(raw)).toThrow('siwe.spaceId has an invalid format')
  })

  test('defaults the elevation window to 60 seconds and validates overrides', () => {
    expect(getElevationWindowSeconds(undefined)).toBe(60)
    expect(getElevationWindowSeconds('1800')).toBe(1800)
    expect(() => getElevationWindowSeconds('0')).toThrow('positive integer')
  })
})
