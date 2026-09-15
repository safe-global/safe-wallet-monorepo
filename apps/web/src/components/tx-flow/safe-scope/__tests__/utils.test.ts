import { faker } from '@faker-js/faker'
import { buildSafeScopeKey, parseSafeScopeKey } from '../utils'

describe('safe-scope utils', () => {
  it('round-trips chainId and address through the key', () => {
    const chainId = '137'
    const safeAddress = faker.finance.ethereumAddress()
    const key = buildSafeScopeKey(chainId, safeAddress)

    expect(key).toBe(`${chainId}:${safeAddress}`)
    expect(parseSafeScopeKey(key)).toEqual({ chainId, safeAddress })
  })

  it('returns undefined for malformed keys', () => {
    expect(parseSafeScopeKey('')).toBeUndefined()
    expect(parseSafeScopeKey('137')).toBeUndefined()
    expect(parseSafeScopeKey(':0xabc')).toBeUndefined()
    expect(parseSafeScopeKey('137:')).toBeUndefined()
  })
})
