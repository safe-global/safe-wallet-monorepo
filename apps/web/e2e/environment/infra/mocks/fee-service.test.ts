import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { BASE_GAS, FEE_COLLECTOR, GAS_PRICE, RELAY_COST_FIAT, SAFE_TX_GAS, dispatch } from './fee-service.ts'

const SAFE = '0x1111111111111111111111111111111111111111'
const NATIVE = '0x0000000000000000000000000000000000000000'
const FEES_PATH = `/v1/chains/11155111/safes/${SAFE}/transactions/relay/fees`

function call(method: string, path: string, body: unknown = ''): [number, unknown] {
  const reply = dispatch({ method, path, body: typeof body === 'string' ? body : JSON.stringify(body) })
  return [reply.status, JSON.parse(reply.body)]
}

describe('fee service', () => {
  it('quotes the fee in the requested token with the fee collector as refund receiver', () => {
    const [status, quote] = call('POST', FEES_PATH, { gasToken: NATIVE, numberSignatures: 2, fiatCode: 'EUR' })

    assert.equal(status, 200)
    assert.deepEqual(quote, {
      txData: {
        chainId: '11155111',
        safeAddress: SAFE,
        safeTxGas: SAFE_TX_GAS,
        baseGas: BASE_GAS,
        gasPrice: GAS_PRICE,
        gasToken: NATIVE,
        refundReceiver: FEE_COLLECTOR,
        numberSignatures: 2,
      },
      relayCost: { fiatCode: 'EUR', fiatValue: RELAY_COST_FIAT },
    })
  })

  it('rejects a quote request without a gas token or a signature count', () => {
    assert.equal(call('POST', FEES_PATH, { numberSignatures: 1 })[0], 400)
    assert.equal(call('POST', FEES_PATH, { gasToken: NATIVE })[0], 400)
  })

  it('lets every Safe transaction hash be relayed', () => {
    const path = `/v1/chains/11155111/transactions/0x${'ab'.repeat(32)}/can-relay`
    assert.deepEqual(call('GET', path), [200, { canRelay: true }])
  })

  it('reports healthy', () => {
    assert.deepEqual(call('GET', '/health'), [200, { ready: true }])
  })

  it('fails other requests explicitly', () => {
    assert.equal(call('GET', FEES_PATH)[0], 404)
    assert.equal(call('POST', `/v1/chains/11155111/safes/${SAFE}/transactions/gtf/fees`)[0], 404)
  })
})
