import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { createWeb3ReadOnly } from '@/src/services/web3'
import { isReadOnlyMethod, proxyReadOnlyCall, __clearProviderCache } from '../readRpcProxy'

jest.mock('@/src/services/web3', () => ({
  createWeb3ReadOnly: jest.fn(),
  // The proxy keys its cache by the resolved url, so the mock derives it from rpcUri.value.
  getRpcServiceUrl: jest.fn((rpcUri?: { value?: string }) => rpcUri?.value ?? ''),
}))
const mockCreateWeb3ReadOnly = createWeb3ReadOnly as jest.Mock

const makeChain = (chainId: string, url = `https://rpc.test/${chainId}`): Chain =>
  ({ chainId, rpcUri: { authentication: 'NO_AUTHENTICATION', value: url } }) as unknown as Chain

describe('isReadOnlyMethod', () => {
  it('accepts allow-listed read-only methods', () => {
    expect(isReadOnlyMethod('eth_call')).toBe(true)
    expect(isReadOnlyMethod('eth_getBalance')).toBe(true)
    expect(isReadOnlyMethod('eth_blockNumber')).toBe(true)
  })

  it('rejects non-allow-listed methods', () => {
    expect(isReadOnlyMethod('eth_sendTransaction')).toBe(false)
    expect(isReadOnlyMethod('personal_sign')).toBe(false)
    expect(isReadOnlyMethod('eth_unknown')).toBe(false)
  })
})

describe('proxyReadOnlyCall', () => {
  beforeEach(() => {
    mockCreateWeb3ReadOnly.mockReset()
    __clearProviderCache()
  })

  it('forwards an allow-listed call to provider.send', async () => {
    const send = jest.fn().mockResolvedValue('0x10')
    mockCreateWeb3ReadOnly.mockReturnValue({ send })
    const result = await proxyReadOnlyCall(makeChain('100'), 'eth_blockNumber', [])
    expect(send).toHaveBeenCalledWith('eth_blockNumber', [])
    expect(result).toBe('0x10')
  })

  it('defaults missing params to an empty array', async () => {
    const send = jest.fn().mockResolvedValue(null)
    mockCreateWeb3ReadOnly.mockReturnValue({ send })
    await proxyReadOnlyCall(makeChain('101'), 'eth_gasPrice', undefined as unknown as unknown[])
    expect(send).toHaveBeenCalledWith('eth_gasPrice', [])
  })

  it('throws for a method outside the allow-list without building a provider', async () => {
    await expect(proxyReadOnlyCall(makeChain('102'), 'eth_sendTransaction', [])).rejects.toThrow(
      'is not in the read-only allow-list',
    )
    expect(mockCreateWeb3ReadOnly).not.toHaveBeenCalled()
  })

  it('throws when no RPC URL is configured for the chain', async () => {
    await expect(proxyReadOnlyCall(makeChain('103', ''), 'eth_call', [{}])).rejects.toThrow(
      'No RPC URL configured for chainId=103',
    )
    expect(mockCreateWeb3ReadOnly).not.toHaveBeenCalled()
  })

  it('caches one provider per chain+url across calls', async () => {
    const send = jest.fn().mockResolvedValue('0x1')
    mockCreateWeb3ReadOnly.mockReturnValue({ send })
    const chain = makeChain('104')
    await proxyReadOnlyCall(chain, 'eth_blockNumber', [])
    await proxyReadOnlyCall(chain, 'eth_gasPrice', [])
    expect(mockCreateWeb3ReadOnly).toHaveBeenCalledTimes(1)
  })

  it('rebuilds the provider when the same chain reports a new RPC url', async () => {
    const send = jest.fn().mockResolvedValue('0x1')
    mockCreateWeb3ReadOnly.mockReturnValue({ send })
    await proxyReadOnlyCall(makeChain('105', 'https://rpc.old/105'), 'eth_blockNumber', [])
    await proxyReadOnlyCall(makeChain('105', 'https://rpc.new/105'), 'eth_blockNumber', [])
    expect(mockCreateWeb3ReadOnly).toHaveBeenCalledTimes(2)
  })

  it('evicts the stale entry on a url swap (does not accumulate per chain)', async () => {
    const send = jest.fn().mockResolvedValue('0x1')
    mockCreateWeb3ReadOnly.mockReturnValue({ send })
    await proxyReadOnlyCall(makeChain('106', 'https://rpc.old/106'), 'eth_blockNumber', [])
    await proxyReadOnlyCall(makeChain('106', 'https://rpc.new/106'), 'eth_blockNumber', [])
    // Reverting to the old url rebuilds — the old entry was evicted, not retained alongside the new.
    await proxyReadOnlyCall(makeChain('106', 'https://rpc.old/106'), 'eth_blockNumber', [])
    expect(mockCreateWeb3ReadOnly).toHaveBeenCalledTimes(3)
  })
})
