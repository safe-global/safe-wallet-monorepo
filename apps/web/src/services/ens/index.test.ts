import { makeError } from 'ethers'
import type { JsonRpcProvider } from 'ethers'
import { lookupAddress, isDomain, resolveNameForChain } from '.'
import { logError } from '../exceptions'
import { ETH_COIN_TYPE } from '@safe-global/utils/utils/ens'

const mockProvider = (error?: Error): JsonRpcProvider =>
  ({
    resolveName: jest.fn(() =>
      error ? Promise.reject(error) : Promise.resolve('0x0000000000000000000000000000000000000001'),
    ),
    lookupAddress: jest.fn(() => (error ? Promise.reject(error) : Promise.resolve('safe.eth'))),
    getNetwork: jest.fn(() => Promise.resolve({ chainId: 1 })),
  }) as unknown as JsonRpcProvider

// mock logError
jest.mock('../exceptions', () => ({
  logError: jest.fn(),
}))

describe('domains', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isDomain', () => {
    it('should check the domain format', async () => {
      expect(isDomain('safe.eth')).toBe(true)
      expect(isDomain('safe.com')).toBe(true)
      expect(isDomain('test.safe.xyz')).toBe(true)
      expect(isDomain('safe.')).toBe(false)
      expect(isDomain('0x123')).toBe(false)
    })
  })

  describe('lookupAddress', () => {
    it('look up addresses', async () => {
      expect(await lookupAddress(mockProvider(), '0x0000000000000000000000000000000000000000')).toBe('safe.eth')
    })

    it('should pass coinType through to the provider', async () => {
      const provider = mockProvider()
      await lookupAddress(provider, '0x0000000000000000000000000000000000000000', ETH_COIN_TYPE)
      expect(provider.lookupAddress).toHaveBeenCalledWith('0x0000000000000000000000000000000000000000', ETH_COIN_TYPE)
    })

    it('should return undefined and log a genuine network failure', async () => {
      const name = await lookupAddress(
        mockProvider(makeError('rpc failed', 'NETWORK_ERROR')),
        '0x0000000000000000000000000000000000000000',
      )
      expect(name).toBe(undefined)
      expect(logError).toHaveBeenCalledWith('101: Failed to resolve the address', expect.stringContaining('rpc failed'))
    })

    it('should return undefined without logging an expected miss', async () => {
      const name = await lookupAddress(
        mockProvider(makeError('network does not support ENS', 'UNSUPPORTED_OPERATION')),
        '0x0000000000000000000000000000000000000000',
      )
      expect(name).toBe(undefined)
      expect(logError).not.toHaveBeenCalled()
    })

    it('should return undefined and log a codeless error', async () => {
      const name = await lookupAddress(
        mockProvider(new TypeError('Failed to fetch')),
        '0x0000000000000000000000000000000000000000',
      )
      expect(name).toBe(undefined)
      expect(logError).toHaveBeenCalledWith('101: Failed to resolve the address', 'Failed to fetch')
    })
  })

  describe('resolveNameForChain', () => {
    // Coin-type behavior is covered in packages/utils; this wrapper only adds error logging.
    it('should resolve a name on the hub for the target chain', async () => {
      const provider = mockProvider()
      expect(await resolveNameForChain(provider, 'safe.eth', 1)).toBe('0x0000000000000000000000000000000000000001')
      expect(provider.resolveName).toHaveBeenCalledWith('safe.eth', ETH_COIN_TYPE)
    })

    it('should return undefined and log a codeless error', async () => {
      const address = await resolveNameForChain(mockProvider(new Error('bad resolveName')), 'safe.eth', 8453)
      expect(address).toBe(undefined)
      expect(logError).toHaveBeenCalledWith('101: Failed to resolve the address', 'bad resolveName')
    })

    it('should return undefined without logging an expected miss', async () => {
      const address = await resolveNameForChain(
        mockProvider(makeError('cannot resolve', 'UNCONFIGURED_NAME')),
        'safe.eth',
        8453,
      )
      expect(address).toBe(undefined)
      expect(logError).not.toHaveBeenCalled()
    })
  })
})
