import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { matchesNetworkSearch } from './utils'

const chain = (chainName: string) => ({ chainName }) as Chain

describe('matchesNetworkSearch', () => {
  it('matches a query that is a substring of the network name', () => {
    expect(matchesNetworkSearch(chain('Gnosis Chain'), 'gnosis')).toBe(true)
    expect(matchesNetworkSearch(chain('Gnosis Chain'), 'chain')).toBe(true)
  })

  it('ignores case on both sides', () => {
    expect(matchesNetworkSearch(chain('Ethereum'), 'ETHER')).toBe(true)
    expect(matchesNetworkSearch(chain('ARBITRUM ONE'), 'arbitrum')).toBe(true)
  })

  it('does not match an unrelated query', () => {
    expect(matchesNetworkSearch(chain('Ethereum'), 'polygon')).toBe(false)
  })

  it('matches every network when the query is empty or only whitespace', () => {
    expect(matchesNetworkSearch(chain('Ethereum'), '')).toBe(true)
    expect(matchesNetworkSearch(chain('Ethereum'), '   ')).toBe(true)
  })

  it('ignores surrounding whitespace in the query', () => {
    expect(matchesNetworkSearch(chain('Polygon'), '  poly  ')).toBe(true)
  })

  it('does not match on the chain id', () => {
    expect(matchesNetworkSearch({ chainName: 'Ethereum' } as Chain, '1')).toBe(false)
  })
})
