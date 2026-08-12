import { makeError } from 'ethers'
import type { JsonRpcProvider } from 'ethers'
import { resolveName, lookupAddress, isDomain } from '.'
import { logError } from '../exceptions'

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

  describe('resolveName', () => {
    it('should resolve names', async () => {
      expect(await resolveName(mockProvider(), 'test.eth')).toBe('0x0000000000000000000000000000000000000001')
    })

    it.each(['NETWORK_ERROR', 'SERVER_ERROR', 'TIMEOUT'] as const)(
      'should return undefined and log a genuine %s failure',
      async (code) => {
        const address = await resolveName(mockProvider(makeError('rpc failed', code)), 'safe.eth')
        expect(address).toBe(undefined)
        expect(logError).toHaveBeenCalledWith(
          '101: Failed to resolve the address',
          expect.stringContaining('rpc failed'),
        )
      },
    )

    it.each(['UNSUPPORTED_OPERATION', 'INVALID_ARGUMENT'] as const)(
      'should return undefined without logging an expected %s miss',
      async (code) => {
        const address = await resolveName(mockProvider(makeError('cannot resolve', code)), 'safe.eth')
        expect(address).toBe(undefined)
        expect(logError).not.toHaveBeenCalled()
      },
    )

    it('should return undefined without logging an unrecognized error', async () => {
      const address = await resolveName(mockProvider(new Error('bad resolveName')), 'safe.eth')
      expect(address).toBe(undefined)
      expect(logError).not.toHaveBeenCalled()
    })
  })

  describe('lookupAddress', () => {
    it('look up addresses', async () => {
      expect(await lookupAddress(mockProvider(), '0x0000000000000000000000000000000000000000')).toBe('safe.eth')
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
  })
})
