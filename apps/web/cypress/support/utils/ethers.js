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
  if (
    target === ENS_UNIVERSAL_RESOLVER &&
    call?.name === 'reverse' &&
    call.args[0] === address.toLowerCase() &&
    call.args[1] === ETH_COIN_TYPE
  ) {
    return ensInterface.encodeFunctionResult('reverse', [name, ENS_MOCK_RESOLVER, ENS_MOCK_RESOLVER])
  }
  return undefined
}

export function mockEnsName(name, prefixedAddress) {
  const address = ethers.getAddress(prefixedAddress.split(':').pop())
  cy.intercept('POST', '**', (req) => {
    const isBatch = Array.isArray(req.body)
    const payloads = isBatch ? req.body : [req.body]
    const results = payloads.map((payload) => ensCallResult(payload, name, address))
    if (results.every((result) => result === undefined)) return

    const toResponse = (index) => ({ jsonrpc: '2.0', id: payloads[index].id, result: results[index] })
    if (results.every((result) => result !== undefined)) {
      req.reply({ body: isBatch ? payloads.map((_, index) => toResponse(index)) : toResponse(0) })
      return
    }
    req.continue((res) => {
      if (!Array.isArray(res.body)) return
      res.body.forEach((entry) => {
        const index = payloads.findIndex((payload) => payload.id === entry.id)
        if (index < 0 || results[index] === undefined) return
        delete entry.error
        entry.result = results[index]
      })
    })
  })
}
