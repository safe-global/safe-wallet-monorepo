import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { JsonRpcProvider, Interface } from 'ethers'
export const RPC_URL = 'http://gnosis-pay.test/rpc'
export const DELAY = '0x0000000000000000000000000000000000000010'
export const OWNER = '0x0000000000000000000000000000000000000020'
export const delayAbi = new Interface([
  'function masterCopy() view returns (address)',
  'function isModuleEnabled(address) view returns (bool)',
  'function txNonce() view returns (uint256)',
  'function txCreatedAt(uint256) view returns (uint256)',
  'function txCooldown() view returns (uint256)',
  'function txExpiration() view returns (uint256)',
])
export const rpcFixture = () => {
  const values = {
    owner: true,
    nonce: 4n,
    created: 1n,
    cooldown: 1n,
    expiry: 0n,
    fail: false,
    code: '0x',
    masterCopy: DELAY,
  }
  const calls: string[] = []
  const handler = http.post(RPC_URL, async ({ request }) => {
    const { id, method, params } = (await request.json()) as { id: number; method: string; params: { data: string }[] }
    if (values.fail)
      return HttpResponse.json({ jsonrpc: '2.0', id, error: { code: -32000, message: 'Fixture RPC failure' } })
    let result = '0x64'
    if (method === 'eth_getCode') result = values.code
    if (method === 'eth_call') {
      const call = delayAbi.parseTransaction({ data: params[0].data })!
      calls.push(call.name)
      const val = {
        masterCopy: values.masterCopy,
        isModuleEnabled: values.owner,
        txNonce: values.nonce,
        txCreatedAt: values.created,
        txCooldown: values.cooldown,
        txExpiration: values.expiry,
      }[call.name]
      result = delayAbi.encodeFunctionResult(call.name, [val])
    }
    return HttpResponse.json({ jsonrpc: '2.0', id, result })
  })
  const provider = new JsonRpcProvider(RPC_URL, 100, { staticNetwork: true, batchMaxCount: 1, cacheTimeout: -1 })
  return { server, handler, provider, values, calls }
}
