import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dispatch } from './price-fixtures.ts'

function get(url: string): [number, unknown] {
  const { pathname, searchParams } = new URL(url, 'http://prices')
  const reply = dispatch({ path: pathname, query: searchParams })
  return [reply.status, JSON.parse(reply.body)]
}

describe('price fixtures', () => {
  it('serves native prices and the supported currencies', () => {
    assert.deepEqual(get('/simple/supported_vs_currencies'), [200, ['usd', 'eur']])
    assert.deepEqual(get('/simple/price?ids=ethereum&vs_currencies=usd,eur'), [
      200,
      { ethereum: { usd: 2000, usd_24h_change: 0, eur: 1800, eur_24h_change: 0 } },
    ])
  })

  it('gives each forked native coin its own price', () => {
    assert.deepEqual(get('/simple/price?ids=ethereum,polygon-ecosystem-token&vs_currencies=usd'), [
      200,
      { ethereum: { usd: 2000, usd_24h_change: 0 }, 'polygon-ecosystem-token': { usd: 0.5, usd_24h_change: 0 } },
    ])
  })

  it('leaves unknown tokens unpriced', () => {
    assert.deepEqual(get('/simple/token_price/ethereum?contract_addresses=0x123'), [200, {}])
    assert.deepEqual(get('/simple/price?ids=unknown&vs_currencies=usd'), [200, {}])
  })

  it('fails unknown requests explicitly', () => {
    assert.equal(get('/simple/price?ids=ethereum&vs_currencies=unknown')[0], 400)
    assert.equal(get('/simple/price?ids=ethereum')[0], 400)
    assert.equal(get('/unsupported')[0], 404)
  })
})
