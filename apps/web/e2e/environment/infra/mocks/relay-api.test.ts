import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { INCLUDED, RELAYER, REVERTED, RpcError, SUBMITTED, dispatch, parseRpcUrls } from './relay-api.ts'
import type { Rpc } from './relay-api.ts'
import { UpstreamUnreachable } from './http.ts'

const SEPOLIA = 'http://anvil:8545'
const MAINNET = 'http://anvil-mainnet:8547'
const URLS = new Map([
  ['11155111', SEPOLIA],
  ['1', MAINNET],
])
const TASK = `0x${'ab'.repeat(32)}`

type Call = [string, string, unknown[]]

function fakeRpc(results: Record<string, unknown>): Rpc & { calls: Call[] } {
  const calls: Call[] = []
  const rpc = async (url: string, method: string, params: unknown[]): Promise<unknown> => {
    calls.push([url, method, params])
    const result = results[`${url} ${method}`] ?? null
    if (result instanceof Error) throw result
    return result
  }
  return Object.assign(rpc, { calls })
}

async function call(method: string, path: string, rpc: Rpc, body?: unknown): Promise<[number, unknown]> {
  const reply = await dispatch({ method, path, body: body ? JSON.stringify(body) : '' }, URLS, rpc)
  return [reply.status, JSON.parse(reply.body)]
}

function message(payload: unknown): string {
  return (payload as { errors: { message: string }[] }).errors[0].message
}

describe('relay API', () => {
  it('relays from the impersonated relayer on the requested fork', async () => {
    const rpc = fakeRpc({ [`${SEPOLIA} eth_sendTransaction`]: TASK })
    const body = { chainId: 11155111, to: '0x1', data: '0x6a76' }
    assert.deepEqual(await call('POST', '/safe-transactions', rpc, body), [200, { taskId: TASK }])
    assert.deepEqual(rpc.calls[1], [SEPOLIA, 'anvil_impersonateAccount', [RELAYER]])
    assert.deepEqual(rpc.calls[2], [SEPOLIA, 'eth_sendTransaction', [{ from: RELAYER, to: '0x1', data: '0x6a76' }]])
  })

  it('rejects a chain without a local fork', async () => {
    const body = { chainId: 137, to: '0x1', data: '0x' }
    const [status, payload] = await call('POST', '/safe-transactions', fakeRpc({}), body)
    assert.equal(status, 400)
    assert.match(message(payload), /137/)
  })

  it('rejects a call without data', async () => {
    assert.equal((await call('POST', '/safe-transactions', fakeRpc({}), { chainId: 1, to: '0x1' }))[0], 400)
  })

  it('rejects a call that the fork reverts', async () => {
    const rpc = fakeRpc({ [`${SEPOLIA} eth_sendTransaction`]: new RpcError('execution reverted') })
    const [revertStatus, revert] = await call('POST', '/safe-transactions', rpc, {
      chainId: '11155111',
      to: '0x1',
      data: '0x6a76',
    })
    assert.equal(revertStatus, 400)
    assert.match(message(revert), /reverted/)
  })

  it('reports included, reverted and pending tasks', async () => {
    const path = `/safe-transactions/${TASK}/status`
    for (const [receipt, expected] of [
      [{ status: '0x1' }, INCLUDED],
      [{ status: '0x0' }, REVERTED],
    ] as const) {
      const rpc = fakeRpc({
        [`${SEPOLIA} eth_getTransactionByHash`]: {},
        [`${SEPOLIA} eth_getTransactionReceipt`]: receipt,
      })
      assert.deepEqual(await call('GET', path, rpc), [200, { taskId: TASK, status: expected, transactionHash: TASK }])
    }
    const pending = fakeRpc({ [`${SEPOLIA} eth_getTransactionByHash`]: {} })
    assert.deepEqual(await call('GET', path, pending), [200, { taskId: TASK, status: SUBMITTED }])
  })

  it('answers 404 for unknown tasks and skips unreachable forks', async () => {
    const rpc = fakeRpc({ [`${MAINNET} eth_getTransactionByHash`]: new UpstreamUnreachable('No answer: TypeError') })
    assert.equal((await call('GET', `/safe-transactions/${TASK}/status`, rpc))[0], 404)
  })

  it('fails a status lookup on an error that is not an unreachable fork', async () => {
    const rpc = fakeRpc({ [`${MAINNET} eth_getTransactionByHash`]: new TypeError('a bug') })
    await assert.rejects(call('GET', `/safe-transactions/${TASK}/status`, rpc), /a bug/)
  })

  it('fails a status lookup that gets a JSON-RPC error', async () => {
    const rpc = fakeRpc({ [`${SEPOLIA} eth_getTransactionByHash`]: new RpcError('bad hash') })
    await assert.rejects(call('GET', `/safe-transactions/${TASK}/status`, rpc), RpcError)
  })

  it('parses RPC URLs', () => {
    assert.deepEqual(
      parseRpcUrls('11155111=http://anvil:8545,1=http://a:1'),
      new Map([
        ['11155111', SEPOLIA],
        ['1', 'http://a:1'],
      ]),
    )
    assert.throws(() => parseRpcUrls(''))
  })
})
