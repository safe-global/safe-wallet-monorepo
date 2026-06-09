/**
 * Wallet credentials parser tests — pure, no browser.
 *
 * Verifies getWalletCredentials parsing/validation. The raw JSON is passed via
 * the `raw` param so these tests never mutate process.env.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { getWalletCredentials, getDefaultSignerKey } from '../../src/data/credentials'

// Fake but well-formed hex keys/addresses — not real secrets.
const VALID_CREDS = JSON.stringify({
  OWNER_1_PRIVATE_KEY: '0x1111111111111111111111111111111111111111111111111111111111111111',
  OWNER_2_PRIVATE_KEY: '0x2222222222222222222222222222222222222222222222222222222222222222',
  OWNER_4_PRIVATE_KEY: '0x4444444444444444444444444444444444444444444444444444444444444444',
  OWNER_1_WALLET_ADDRESS: '0x1111111111111111111111111111111111111111',
  OWNER_2_WALLET_ADDRESS: '0x2222222222222222222222222222222222222222',
})

test.describe('Wallet credentials parser', { tag: '@api' }, () => {
  test('parses valid JSON into a typed object', () => {
    const creds = getWalletCredentials(VALID_CREDS)

    expect(creds.OWNER_4_PRIVATE_KEY).toBe('0x4444444444444444444444444444444444444444444444444444444444444444')
    expect(creds.OWNER_1_WALLET_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/)
  })

  test('getDefaultSignerKey returns OWNER_4_PRIVATE_KEY', () => {
    const creds = getWalletCredentials(VALID_CREDS)

    expect(getDefaultSignerKey(creds)).toBe(creds.OWNER_4_PRIVATE_KEY)
  })

  test('throws mentioning CYPRESS_WALLET_CREDENTIALS when raw is undefined', () => {
    expect(() => getWalletCredentials(undefined)).toThrow(/CYPRESS_WALLET_CREDENTIALS/)
  })

  test('throws mentioning CYPRESS_WALLET_CREDENTIALS when raw is empty', () => {
    expect(() => getWalletCredentials('   ')).toThrow(/CYPRESS_WALLET_CREDENTIALS/)
  })

  test('throws on malformed JSON', () => {
    expect(() => getWalletCredentials('{ not valid json')).toThrow(/Failed to parse/)
  })

  test('throws when OWNER_4_PRIVATE_KEY is missing', () => {
    const missingSigner = JSON.stringify({
      OWNER_1_PRIVATE_KEY: '0x1111111111111111111111111111111111111111111111111111111111111111',
      OWNER_1_WALLET_ADDRESS: '0x1111111111111111111111111111111111111111',
    })

    expect(() => getWalletCredentials(missingSigner)).toThrow(/OWNER_4_PRIVATE_KEY/)
  })
})
