import type { JsonRpcProvider } from 'ethers'
import { resolveName, lookupAddress, isDomain } from '.'
import { logError } from '../exceptions'

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

    it('should log and throw if lookup fails', async () => {
      await expect(lookupAddress(badRpcProvider, '0x0000000000000000000000000000000000000000')).rejects.toThrow(
        'bad lookupAddress',
      )
      expect(logError).toHaveBeenCalledWith('101: Failed to resolve the address', 'bad lookupAddress')
    })
  })
})
