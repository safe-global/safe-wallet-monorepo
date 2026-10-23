import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { FORK_CHAIN_IDS, dispatch } from './lifi-api.ts'
import { LIFI_DIAMOND_ADDRESS } from './lifi-constants.ts'

const TX_HASH = `0x${'ab'.repeat(32)}`

function call(method: string, path: string, query = ''): [number, unknown] {
  const reply = dispatch({ method, path, query: new URLSearchParams(query) })
  return [reply.status, JSON.parse(reply.body)]
}

describe('LiFi API mock', () => {
  it('lists the Diamond on every fork chain', () => {
    const [status, body] = call('GET', '/v1/chains', 'chainTypes=EVM')

    assert.equal(status, 200)
    assert.deepEqual(body, {
      chains: [
        { id: 11155111, diamondAddress: LIFI_DIAMOND_ADDRESS },
        { id: 1, diamondAddress: LIFI_DIAMOND_ADDRESS },
        { id: 137, diamondAddress: LIFI_DIAMOND_ADDRESS },
      ],
    })
    assert.deepEqual(FORK_CHAIN_IDS, [11155111, 1, 137])
  })

  it('reports a transfer as not found, with the sending transaction asked for', () => {
    assert.deepEqual(call('GET', '/v1/status', `txHash=${TX_HASH}&fromChain=11155111&toChain=137`), [
      200,
      {
        status: 'NOT_FOUND',
        substatus: 'UNKNOWN_FAILED_ERROR',
        substatusMessage: null,
        sending: { txHash: TX_HASH, chainId: 11155111, txLink: '' },
      },
    ])
  })

  it('refuses a status request without the transaction hash or the source chain', () => {
    assert.equal(call('GET', '/v1/status', 'fromChain=11155111')[0], 400)
    assert.equal(call('GET', '/v1/status', `txHash=${TX_HASH}`)[0], 400)
  })

  it('reports healthy', () => {
    assert.deepEqual(call('GET', '/health'), [200, { ready: true }])
  })

  it('fails other requests explicitly', () => {
    assert.equal(call('POST', '/v1/chains')[0], 404)
    assert.equal(call('GET', '/v1/quote')[0], 404)
  })
})
