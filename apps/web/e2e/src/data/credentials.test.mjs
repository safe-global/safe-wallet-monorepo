import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getDefaultSignerKey, getWalletCredentials } from './credentials.ts'

// Well-formed hex keys and addresses, not real secrets
const OWNER_4_KEY = `0x${'4'.repeat(64)}`
const VALID_CREDENTIALS = JSON.stringify({
  OWNER_1_PRIVATE_KEY: `0x${'1'.repeat(64)}`,
  OWNER_2_PRIVATE_KEY: `0x${'2'.repeat(64)}`,
  OWNER_4_PRIVATE_KEY: OWNER_4_KEY,
  OWNER_1_WALLET_ADDRESS: `0x${'1'.repeat(40)}`,
  OWNER_2_WALLET_ADDRESS: `0x${'2'.repeat(40)}`,
})

describe('getWalletCredentials', () => {
  it('parses valid JSON into the owners keys and addresses', () => {
    const credentials = getWalletCredentials(VALID_CREDENTIALS)

    assert.equal(credentials.OWNER_4_PRIVATE_KEY, OWNER_4_KEY)
    assert.match(credentials.OWNER_1_WALLET_ADDRESS, /^0x[a-fA-F0-9]{40}$/)
  })

  it('accepts credentials with only the OWNER_4 key', () => {
    const credentials = getWalletCredentials(JSON.stringify({ OWNER_4_PRIVATE_KEY: OWNER_4_KEY }))

    assert.equal(credentials.OWNER_4_PRIVATE_KEY, OWNER_4_KEY)
    assert.equal(credentials.OWNER_1_PRIVATE_KEY, undefined)
    assert.equal(credentials.OWNER_2_WALLET_ADDRESS, undefined)
  })

  it('reads CYPRESS_WALLET_CREDENTIALS when no JSON is given, and names it when it is not set', () => {
    const saved = process.env.CYPRESS_WALLET_CREDENTIALS
    delete process.env.CYPRESS_WALLET_CREDENTIALS
    try {
      assert.throws(() => getWalletCredentials(), /CYPRESS_WALLET_CREDENTIALS/)
    } finally {
      if (saved !== undefined) process.env.CYPRESS_WALLET_CREDENTIALS = saved
    }
  })

  it('names CYPRESS_WALLET_CREDENTIALS when the JSON is blank', () => {
    assert.throws(() => getWalletCredentials('   '), /CYPRESS_WALLET_CREDENTIALS/)
  })

  it('rejects malformed JSON', () => {
    assert.throws(() => getWalletCredentials('{ not valid json'), /Failed to parse/)
  })

  it('rejects credentials without the OWNER_4 key', () => {
    const missingSigner = JSON.stringify({ OWNER_1_PRIVATE_KEY: `0x${'1'.repeat(64)}` })

    assert.throws(() => getWalletCredentials(missingSigner), /OWNER_4_PRIVATE_KEY/)
  })

  it('rejects an OWNER_4 key that is not a string', () => {
    assert.throws(() => getWalletCredentials(JSON.stringify({ OWNER_4_PRIVATE_KEY: 1234 })), /OWNER_4_PRIVATE_KEY/)
  })
})

describe('getDefaultSignerKey', () => {
  it('returns the OWNER_4 key', () => {
    assert.equal(getDefaultSignerKey(getWalletCredentials(VALID_CREDENTIALS)), OWNER_4_KEY)
  })
})
