import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { dispatch, forkRpc, validateRequest } from './fork-rpc.ts'
import type { Forward } from './fork-rpc.ts'
import { serve } from './http.ts'

function logs(fromBlock: string, toBlock = 'latest'): Record<string, unknown> {
  return { jsonrpc: '2.0', id: 1, method: 'eth_getLogs', params: [{ fromBlock, toBlock }] }
}

function recordingForward(result: unknown = { id: 1, result: [] }): Forward & { calls: unknown[] } {
  const calls: unknown[] = []
  const forward: Forward = async (request) => {
    calls.push(request)
    return result
  }
  return Object.assign(forward, { calls })
}

async function closedPortUrl(): Promise<string> {
  const probe = createServer()
  await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve))
  const { port } = probe.address() as AddressInfo
  await new Promise((resolve) => probe.close(resolve))
  return `http://127.0.0.1:${port}`
}

describe('fork RPC server', () => {
  let logged: string[]
  let upstream: string
  let url: string
  let close: () => void

  beforeEach(async () => {
    logged = []
    upstream = await closedPortUrl()
    const server = serve(
      0,
      forkRpc(100, upstream, (message) => logged.push(message)),
    )
    await new Promise((resolve) => server.once('listening', resolve))
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    close = () => server.close()
  })

  afterEach(() => close())

  async function post(body: string): Promise<number> {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    await response.body?.cancel()
    return response.status
  }

  it('answers malformed JSON with a client error', async () => {
    assert.equal(await post('{not json'), 400)
  })

  it('logs an unreachable upstream without its URL', async () => {
    assert.equal(await post(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber' })), 502)
    const failure = logged.find((message) => message.includes('upstream request failed'))
    assert.ok(failure)
    assert.equal(failure.includes(upstream), false)
    assert.equal(failure.includes('127.0.0.1'), false)
  })

  it('counts rejected requests in its status', async () => {
    await post(JSON.stringify(logs('0x1')))
    const status = (await (await fetch(`${url}/status`)).json()) as Record<string, unknown>
    assert.equal(status.forkBlock, 100)
    assert.equal(status.rejectedRequests, 1)
  })

  it('refuses a fork block that is not positive', () => {
    assert.throws(() => forkRpc(0, upstream), /positive/)
  })
})

describe('fork RPC guard', () => {
  it('forwards the boundary block and new blocks', async () => {
    for (const start of ['0x64', '0x65']) {
      const forward = recordingForward()
      assert.deepEqual(await dispatch(logs(start), 100, forward), { id: 1, result: [] })
      assert.deepEqual(forward.calls, [logs(start)])
    }
  })

  it('never sends a historical scan upstream', async () => {
    const forward = recordingForward()
    const result = (await dispatch(logs('0x63'), 100, forward)) as { error: { message: string } }
    assert.match(result.error.message, /below fork block/)
    assert.deepEqual(forward.calls, [])
  })

  it('allows historical state reads', async () => {
    const request = { id: 2, method: 'eth_getCode', params: ['0x123', '0x0'] }
    const forward = recordingForward({ id: 2, result: '0x1234' })
    assert.deepEqual(await dispatch(request, 100, forward), { id: 2, result: '0x1234' })
  })

  it('checks each member of a batch', async () => {
    const forward = recordingForward()
    const [rejected, forwarded] = (await dispatch([logs('0x0'), logs('0x64')], 100, forward)) as Record<
      string,
      unknown
    >[]
    assert.ok('error' in rejected)
    assert.ok('result' in forwarded)
    assert.equal(forward.calls.length, 1)
  })

  it('rejects missing, ambiguous and hash bounds', () => {
    const queries = [
      {},
      { blockHash: '0xabc' },
      { fromBlock: 'earliest', toBlock: 'latest' },
      { fromBlock: 'latest', toBlock: 'latest' },
      { fromBlock: '0x64', toBlock: 'safe' },
      { fromBlock: '0x64', toBlock: '0x1' },
      { fromBlock: '0xno', toBlock: 'latest' },
    ]
    for (const query of queries) {
      assert.throws(
        () => validateRequest({ method: 'eth_getLogs', params: [query] }, 100),
        Error,
        JSON.stringify(query),
      )
    }
  })

  it('does not let unsupported indexing methods bypass the guard', () => {
    for (const method of [
      'trace_filter',
      'trace_block',
      'debug_traceTransaction',
      'eth_newFilter',
      'eth_getFilterLogs',
    ]) {
      assert.throws(() => validateRequest({ method, params: [] }, 100), Error, method)
    }
  })
})
