import type { JsonRpcProvider } from 'ethers'
import { resolveName, lookupAddress, isDomain, resolveNameForChain } from '.'
import { logError } from '../exceptions'
import { ETH_COIN_TYPE } from '@safe-global/utils/utils/ens'

// mock rpcProvider
const rpcProvider = {
  resolveName: jest.fn(() => Promise.resolve('0x0000000000000000000000000000000000000001')),
  lookupAddress: jest.fn(() => Promise.resolve('safe.eth')),
  getNetwork: jest.fn(() => Promise.resolve({ chainId: 1 })),
} as unknown as JsonRpcProvider

const badRpcProvider = {
  resolveName: jest.fn(() => Promise.reject(new Error('bad resolveName'))),
  lookupAddress: jest.fn(() => Promise.reject(new Error('bad lookupAddress'))),
  getNetwork: jest.fn(() => Promise.resolve({ chainId: 1 })),
} as unknown as JsonRpcProvider

// mock logError
jest.mock('../exceptions', () => ({
  logError: jest.fn(),
}))

describe('domains', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(rpcProvider.resolveName as jest.Mock).mockResolvedValue('0x0000000000000000000000000000000000000001')
    ;(rpcProvider.lookupAddress as jest.Mock).mockResolvedValue('safe.eth')
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

  describe('resolveName', () => {
    it('should resolve names', async () => {
      expect(await resolveName(rpcProvider, 'test.eth')).toBe('0x0000000000000000000000000000000000000001')
    })

    it('should pass coinType through to the provider', async () => {
      await resolveName(rpcProvider, 'test.eth', ETH_COIN_TYPE)
      expect(rpcProvider.resolveName).toHaveBeenCalledWith('test.eth', ETH_COIN_TYPE)
    })

    it('should return undefined and log on error', async () => {
      const address = await resolveName(badRpcProvider, 'safe.eth')
      expect(address).toBe(undefined)
      expect(logError).toHaveBeenCalledWith('101: Failed to resolve the address', 'bad resolveName')
    })
  })

  describe('lookupAddress', () => {
    it('look up addresses', async () => {
      expect(await lookupAddress(rpcProvider, '0x0000000000000000000000000000000000000000')).toBe('safe.eth')
    })

    it('should pass coinType through to the provider', async () => {
      await lookupAddress(rpcProvider, '0x0000000000000000000000000000000000000000', ETH_COIN_TYPE)
      expect(rpcProvider.lookupAddress).toHaveBeenCalledWith(
        '0x0000000000000000000000000000000000000000',
        ETH_COIN_TYPE,
      )
    })

    it('should log an error if lookup fails', async () => {
      const name = await lookupAddress(badRpcProvider, '0x0000000000000000000000000000000000000000')
      expect(name).toBe(undefined)
      expect(logError).toHaveBeenCalledWith('101: Failed to resolve the address', 'bad lookupAddress')
    })
  })

  describe('resolveNameForChain', () => {
    // Coin-type / fallback behavior is covered in packages/utils; this wrapper only adds error logging.
    it('should return undefined and log on error', async () => {
      const address = await resolveNameForChain(badRpcProvider, 'safe.eth', 8453)
      expect(address).toBe(undefined)
      expect(logError).toHaveBeenCalledWith('101: Failed to resolve the address', 'bad resolveName')
    })
  })
})
