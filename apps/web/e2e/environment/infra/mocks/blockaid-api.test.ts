import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DRAINER_ADDRESS, SCAN_ERROR_ADDRESS } from './blockaid-addresses.ts'
import { dispatch } from './blockaid-api.ts'

const SAFE = '0x1111111111111111111111111111111111111111'
const OWNER = '0x2222222222222222222222222222222222222222'
const RECIPIENT = '0x3333333333333333333333333333333333333333'
const API_KEY = { 'x-api-key': 'local-test-only' }

type Validation = { result_type: string; status: string; features: { type: string; feature_id: string }[] }
type ScanAnswer = { chain: string; validation: Validation; simulation?: { status: string } }

function typedData(to: string, data = '0x'): string {
  return JSON.stringify({
    domain: { chainId: 11155111, verifyingContract: SAFE },
    primaryType: 'SafeTx',
    message: { to, value: '1000000000000000', data, operation: 0, nonce: 0 },
  })
}

function transactionScan(message: string): unknown {
  return {
    chain: '0xaa36a7',
    data: { method: 'eth_signTypedData_v4', params: [SAFE, message] },
    options: ['simulation', 'validation'],
    metadata: { non_dapp: true },
    account_address: OWNER,
  }
}

function call(path: string, payload: unknown, headers: Record<string, string> = API_KEY): [number, unknown] {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const reply = dispatch({ method: 'POST', path, headers, body })
  return [reply.status, JSON.parse(reply.body)]
}

function scan(message: string): ScanAnswer {
  const [status, answer] = call('/v0/evm/json-rpc/scan', transactionScan(message))
  assert.equal(status, 200)
  return answer as ScanAnswer
}

describe('Blockaid API', () => {
  it('scans a transfer to an ordinary recipient as benign', () => {
    const answer = scan(typedData(RECIPIENT))
    assert.equal(answer.chain, '0xaa36a7')
    assert.equal(answer.validation.result_type, 'Benign')
    assert.equal(answer.simulation?.status, 'Success')
  })

  it('scans a transfer to the drainer as malicious with a drainer feature', () => {
    const { validation } = scan(typedData(DRAINER_ADDRESS))
    assert.equal(validation.result_type, 'Malicious')
    assert.equal(validation.status, 'Success')
    assert.deepEqual(
      validation.features.map(({ type, feature_id }) => [type, feature_id]),
      [['Malicious', 'KNOWN_DRAINER']],
    )
  })

  it('finds the drainer in any letter case, as the wallet sends checksummed addresses', () => {
    const checksummed = `0x${DRAINER_ADDRESS.slice(2).toUpperCase()}`
    assert.equal(scan(typedData(checksummed)).validation.result_type, 'Malicious')
  })

  it('finds the drainer inside calldata, such as a token transfer to it', () => {
    const transfer = `0xa9059cbb${DRAINER_ADDRESS.slice(2).padStart(64, '0')}${'1'.padStart(64, '0')}`
    assert.equal(scan(typedData(RECIPIENT, transfer)).validation.result_type, 'Malicious')
  })

  it('fails the scan of a transaction that names the error address, without a simulation', () => {
    const answer = scan(typedData(SCAN_ERROR_ADDRESS))
    assert.equal(answer.validation.result_type, 'Error')
    assert.equal(answer.simulation, undefined)
  })

  it('flags only the drainer in an address bulk scan', () => {
    const body = { chain: 'ethereum-sepolia', addresses: [RECIPIENT, DRAINER_ADDRESS], metadata: { domain: 'x' } }
    assert.deepEqual(call('/v0/evm/address-bulk/scan', body), [
      200,
      { [RECIPIENT]: 'Benign', [DRAINER_ADDRESS]: 'Malicious' },
    ])
  })

  it('rejects requests that are not a scan the gateway sends', () => {
    const typed = typedData(RECIPIENT)
    const garbage: unknown[] = [
      'not json',
      {},
      { chain: '0xaa36a7', data: { method: 'eth_sendTransaction', params: [SAFE, typed] } },
      { chain: '0xaa36a7', data: { method: 'eth_signTypedData_v4', params: [SAFE, 'not json'] } },
      { chain: '0xaa36a7', data: { method: 'eth_signTypedData_v4', params: [SAFE] } },
    ]
    for (const payload of garbage) assert.equal(call('/v0/evm/json-rpc/scan', payload)[0], 400, String(payload))
    assert.equal(call('/v0/evm/address-bulk/scan', { chain: 'ethereum-sepolia', addresses: [1] })[0], 400)
    assert.equal(call('/v0/evm/address-bulk/scan', { addresses: [RECIPIENT] })[0], 400)
  })

  it('requires the API key, as Blockaid does', () => {
    assert.equal(call('/v0/evm/json-rpc/scan', transactionScan(typedData(RECIPIENT)), {})[0], 401)
  })

  it('reports healthy and fails other routes explicitly', () => {
    assert.equal(dispatch({ method: 'GET', path: '/health', headers: {}, body: '' }).status, 200)
    assert.equal(dispatch({ method: 'GET', path: '/v0/evm/json-rpc/scan', headers: API_KEY, body: '' }).status, 404)
    assert.equal(call('/v0/evm/transaction/report', {})[0], 404)
  })
})
