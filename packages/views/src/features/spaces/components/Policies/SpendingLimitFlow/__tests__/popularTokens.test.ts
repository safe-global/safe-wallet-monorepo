import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { POPULAR_TOKEN_ADDRESSES, getPopularTokenAddresses } from '../popularTokens'

const EXPECTED_CHAINS = ['1', '10', '42161', '56', '8453', '137', '100', '43114', '11155111']
/** CGW's batch endpoint accepts at most this many addresses per request. */
const CGW_BATCH_CAP = 20
/** The shortest list today. Falling under it means a chain lost entries rather than being curated. */
const MIN_ADDRESSES_PER_CHAIN = 7

describe('POPULAR_TOKEN_ADDRESSES', () => {
  it('covers exactly the agreed chains', () => {
    expect(Object.keys(POPULAR_TOKEN_ADDRESSES).sort()).toEqual([...EXPECTED_CHAINS].sort())
  })

  it.each(EXPECTED_CHAINS)('chain %s lists enough addresses, within the CGW batch cap', (chainId) => {
    const addresses = POPULAR_TOKEN_ADDRESSES[chainId]
    expect(addresses.length).toBeGreaterThanOrEqual(MIN_ADDRESSES_PER_CHAIN)
    expect(addresses.length).toBeLessThanOrEqual(CGW_BATCH_CAP)
  })

  it.each(EXPECTED_CHAINS)('chain %s addresses are EIP-55 checksummed and unique', (chainId) => {
    const addresses = POPULAR_TOKEN_ADDRESSES[chainId]
    for (const address of addresses) {
      expect(getAddress(address)).toBe(address)
    }
    expect(new Set(addresses.map((address) => address.toLowerCase())).size).toBe(addresses.length)
  })

  it('never lists the native currency placeholder address', () => {
    expect(
      Object.values(POPULAR_TOKEN_ADDRESSES)
        .flat()
        .some((address) => /^0x0{40}$/.test(address)),
    ).toBe(false)
  })
})

describe('getPopularTokenAddresses', () => {
  it('returns the table entry for a known chain', () => {
    expect(getPopularTokenAddresses('1')).toBe(POPULAR_TOKEN_ADDRESSES['1'])
  })

  it('returns an empty list for an unknown chain', () => {
    expect(getPopularTokenAddresses(faker.string.numeric({ length: 7 }))).toEqual([])
  })
})
