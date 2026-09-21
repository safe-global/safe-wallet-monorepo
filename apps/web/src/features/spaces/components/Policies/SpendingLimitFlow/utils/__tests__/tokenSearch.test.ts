import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { matchesTokenQuery } from '../tokenSearch'

const token = (symbol: string, name: string) => ({
  symbol,
  name,
  address: checksumAddress(faker.finance.ethereumAddress()),
})

describe('matchesTokenQuery', () => {
  const usdc = token('USDC', 'USD Coin')

  it('matches an empty or whitespace query', () => {
    expect(matchesTokenQuery(usdc, '')).toBe(true)
    expect(matchesTokenQuery(usdc, '   ')).toBe(true)
  })

  it('matches symbol, name and address case-insensitively as substrings', () => {
    expect(matchesTokenQuery(usdc, 'usd')).toBe(true)
    expect(matchesTokenQuery(usdc, 'coin')).toBe(true)
    expect(matchesTokenQuery(usdc, usdc.address.slice(2, 10).toUpperCase())).toBe(true)
  })

  it('trims the query', () => {
    expect(matchesTokenQuery(usdc, '  usdc ')).toBe(true)
  })

  it('rejects non-matching text', () => {
    expect(matchesTokenQuery(usdc, 'dai')).toBe(false)
  })
})
