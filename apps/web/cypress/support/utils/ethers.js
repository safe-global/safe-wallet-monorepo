import { ethers } from 'ethers'

export const getMockAddress = () => {
  return ethers.getAddress('0x1234567890abcdef1234567890abcdef12345678')
}

const ENS_UNIVERSAL_RESOLVER = '0xeeeeeeee14d718c2b47d9923deab1335e144eeee'
const ENS_MOCK_RESOLVER = '0x8fade66b79cc9f707ab26799354482eb93a5b7dd'
const ETH_COIN_TYPE = 60n

const ensInterface = new ethers.Interface([
  'function requireResolver(bytes) view returns ((bytes name, uint256 offset, bytes32 node, address resolver, bool extended))',
  'function reverse(bytes lookupAddress, uint256 coinType) view returns (string primary, address resolver, address reverseResolver)',
  'function addr(bytes32) view returns (address)',
])

const ensCallResult = (payload, name, address) => {
  if (payload?.method !== 'eth_call') return undefined
  const { to, data } = payload.params?.[0] ?? {}
  if (typeof to !== 'string' || typeof data !== 'string') return undefined
  const target = to.toLowerCase()
  if (target !== ENS_UNIVERSAL_RESOLVER && target !== ENS_MOCK_RESOLVER) return undefined
  const call = ensInterface.parseTransaction({ data })
  const dnsName = ethers.dnsEncode(name, 255)
  const node = ethers.namehash(name)

  if (target === ENS_UNIVERSAL_RESOLVER && call?.name === 'requireResolver' && call.args[0] === dnsName) {
    return ensInterface.encodeFunctionResult('requireResolver', [[dnsName, 0, node, ENS_MOCK_RESOLVER, false]])
  }
  if (target === ENS_MOCK_RESOLVER && call?.name === 'addr' && call.args[0] === node) {
    return ensInterface.encodeFunctionResult('addr', [address])
  }
  if (target === ENS_UNIVERSAL_RESOLVER && call?.name === 'reverse' && call.args[1] === ETH_COIN_TYPE) {
    return call.args[0] === address.toLowerCase()
      ? ensInterface.encodeFunctionResult('reverse', [name, ENS_MOCK_RESOLVER, ENS_MOCK_RESOLVER])
      : ensInterface.encodeFunctionResult('reverse', ['', ethers.ZeroAddress, ethers.ZeroAddress])
  }
  return undefined
}

const fetchRpcResponses = async (url, payloads) => {
  if (payloads.length === 0) return []
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payloads),
  })
  const body = await response.json()
  return Array.isArray(body) ? body : [body]
}

export function mockEnsName(name, prefixedAddress) {
  const address = ethers.getAddress(prefixedAddress.split(':').pop())
  cy.intercept('POST', '**', async (req) => {
    const isBatch = Array.isArray(req.body)
    const payloads = isBatch ? req.body : [req.body]
    const results = payloads.map((payload) => ensCallResult(payload, name, address))
    if (results.every((result) => result === undefined)) return

    const upstream = await fetchRpcResponses(
      req.url,
      payloads.filter((_, index) => results[index] === undefined),
    )
    const body = payloads.map((payload, index) =>
      results[index] === undefined
        ? upstream.find((entry) => entry.id === payload.id)
        : { jsonrpc: '2.0', id: payload.id, result: results[index] },
    )
    req.reply({ body: isBatch ? body : body[0] })
  })
}
