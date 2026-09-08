import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { POPULAR_TOKENS, getPopularTokens } from '../popularTokens'

const EXPECTED_CHAINS = ['1', '56', '8453', '137', '100', '43114', '11155111']

describe('POPULAR_TOKENS', () => {
  it('covers exactly the agreed chains', () => {
    expect(Object.keys(POPULAR_TOKENS).sort()).toEqual([...EXPECTED_CHAINS].sort())
  })

  it.each(EXPECTED_CHAINS)('chain %s has between 4 and 8 tokens with complete metadata', (chainId) => {
    const tokens = POPULAR_TOKENS[chainId]
    expect(tokens.length).toBeGreaterThanOrEqual(4)
    expect(tokens.length).toBeLessThanOrEqual(8)
    for (const token of tokens) {
      expect(token.symbol).not.toBe('')
      expect(token.name).not.toBe('')
      expect(token.logoUri).toMatch(/^https:\/\//)
      expect(token.decimals).toBeGreaterThanOrEqual(0)
      expect(token.decimals).toBeLessThanOrEqual(18)
    }
  })

  it.each(EXPECTED_CHAINS)('chain %s addresses are EIP-55 checksummed and unique', (chainId) => {
    const addresses = POPULAR_TOKENS[chainId].map((token) => token.address)
    for (const address of addresses) {
      expect(getAddress(address)).toBe(address)
    }
    expect(new Set(addresses.map((address) => address.toLowerCase())).size).toBe(addresses.length)
  })

  it('never lists the native currency placeholder address', () => {
    const all = Object.values(POPULAR_TOKENS).flat()
    expect(all.some((token) => /^0x0{40}$/.test(token.address))).toBe(false)
  })
})

describe('getPopularTokens', () => {
  it('returns the table entry for a known chain', () => {
    expect(getPopularTokens('1')).toBe(POPULAR_TOKENS['1'])
  })

  it('returns an empty list for an unknown chain', () => {
    expect(getPopularTokens(faker.string.numeric({ length: 7 }))).toEqual([])
  })
})
