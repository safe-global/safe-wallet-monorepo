import { keccak256 } from 'ethers'
import type { JsonRpcProvider } from 'ethers'
import { isHypernativeGuard, HYPERNATIVE_GUARD_CODE_HASHES } from '../hypernativeGuardCheck'
import { logError, Errors } from '@/services/exceptions'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

// Mock bytecode for testing (must be even-length hex strings)
const MOCK_HYPERNATIVE_GUARD_BYTECODE = '0x608060405234801561001057600080fd5b50600436106100365760003560e01c'
const MOCK_OTHER_GUARD_BYTECODE = '0x123456789abcdef0'
const MOCK_HYPERNATIVE_CODE_HASH = keccak256(MOCK_HYPERNATIVE_GUARD_BYTECODE)

describe('isHypernativeGuard', () => {
  let mockProvider: jest.Mocked<JsonRpcProvider>
  let originalHashes: string[]

  beforeEach(() => {
    jest.clearAllMocks()

    // Clear memoization cache
    if (isHypernativeGuard.cache && typeof isHypernativeGuard.cache.clear === 'function') {
      isHypernativeGuard.cache.clear()
    }

    mockProvider = {
      getCode: jest.fn(),
    } as unknown as jest.Mocked<JsonRpcProvider>

    // Store original hashes and setup test hashes
    originalHashes = [...HYPERNATIVE_GUARD_CODE_HASHES]
    HYPERNATIVE_GUARD_CODE_HASHES.length = 0
    HYPERNATIVE_GUARD_CODE_HASHES.push(MOCK_HYPERNATIVE_CODE_HASH)
  })

  afterEach(() => {
    // Restore original hashes
    HYPERNATIVE_GUARD_CODE_HASHES.length = 0
    HYPERNATIVE_GUARD_CODE_HASHES.push(...originalHashes)

    // Clear memoization cache after each test
    if (isHypernativeGuard.cache && typeof isHypernativeGuard.cache.clear === 'function') {
      isHypernativeGuard.cache.clear()
    }
  })

  it('should return false if guardAddress is null', async () => {
    const result = await isHypernativeGuard(null, mockProvider)
    expect(result).toBe(false)
    expect(mockProvider.getCode).not.toHaveBeenCalled()
  })

  it('should return false if guardAddress is undefined', async () => {
    const result = await isHypernativeGuard(undefined, mockProvider)
    expect(result).toBe(false)
    expect(mockProvider.getCode).not.toHaveBeenCalled()
  })

  it('should return false if provider is undefined', async () => {
    const result = await isHypernativeGuard('0x1234567890123456789012345678901234567890', undefined)
    expect(result).toBe(false)
  })

  it('should return false if there are no known hashes', async () => {
    HYPERNATIVE_GUARD_CODE_HASHES.length = 0
    const result = await isHypernativeGuard('0x1234567890123456789012345678901234567890', mockProvider)
    expect(result).toBe(false)
    expect(mockProvider.getCode).not.toHaveBeenCalled()
  })

  it('should return false if the bytecode is empty', async () => {
    mockProvider.getCode.mockResolvedValue('0x')
    const result = await isHypernativeGuard('0x1234567890123456789012345678901234567890', mockProvider)
    expect(result).toBe(false)
    expect(mockProvider.getCode).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890')
  })

  it('should return true if the code hash matches a known HypernativeGuard hash', async () => {
    mockProvider.getCode.mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE)
    const result = await isHypernativeGuard('0x1234567890123456789012345678901234567890', mockProvider)
    expect(result).toBe(true)
    expect(mockProvider.getCode).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890')
  })

  it('should return false if the code hash does not match any known hash', async () => {
    mockProvider.getCode.mockResolvedValue(MOCK_OTHER_GUARD_BYTECODE)
    const result = await isHypernativeGuard('0x1234567890123456789012345678901234567890', mockProvider)
    expect(result).toBe(false)
    expect(mockProvider.getCode).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890')
  })

  it('should handle provider errors gracefully', async () => {
    mockProvider.getCode.mockRejectedValue(new Error('Network error'))

    const result = await isHypernativeGuard('0x1234567890123456789012345678901234567890', mockProvider)

    expect(result).toBe(false)
    expect(logError).toHaveBeenCalledWith(Errors._809, expect.any(Error))
  })

  it('should support multiple code hashes', async () => {
    const SECOND_MOCK_BYTECODE = '0xdeadbeef'
    const SECOND_MOCK_CODE_HASH = keccak256(SECOND_MOCK_BYTECODE)
    HYPERNATIVE_GUARD_CODE_HASHES.push(SECOND_MOCK_CODE_HASH)

    // Test first hash
    mockProvider.getCode.mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE)
    let result = await isHypernativeGuard('0x1234567890123456789012345678901234567890', mockProvider)
    expect(result).toBe(true)

    // Test second hash
    mockProvider.getCode.mockResolvedValue(SECOND_MOCK_BYTECODE)
    result = await isHypernativeGuard('0x9876543210987654321098765432109876543210', mockProvider)
    expect(result).toBe(true)

    // Test unmatched hash
    mockProvider.getCode.mockResolvedValue(MOCK_OTHER_GUARD_BYTECODE)
    result = await isHypernativeGuard('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', mockProvider)
    expect(result).toBe(false)
  })

  it('should handle empty known hashes array', async () => {
    HYPERNATIVE_GUARD_CODE_HASHES.length = 0
    const result = await isHypernativeGuard('0x1234567890123456789012345678901234567890', mockProvider)
    expect(result).toBe(false)
    expect(mockProvider.getCode).not.toHaveBeenCalled()
  })

  describe('memoization', () => {
    beforeEach(() => {
      // Clear the memoization cache before each test
      if (isHypernativeGuard.cache && typeof isHypernativeGuard.cache.clear === 'function') {
        isHypernativeGuard.cache.clear()
      }
    })

    it('should cache results and not call provider.getCode again for the same address', async () => {
      mockProvider.getCode.mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE)

      const guardAddress = '0x1234567890123456789012345678901234567890'

      // First call
      const result1 = await isHypernativeGuard(guardAddress, mockProvider)
      expect(result1).toBe(true)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1)

      // Second call with same address - should use cache
      const result2 = await isHypernativeGuard(guardAddress, mockProvider)
      expect(result2).toBe(true)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1) // Still only 1 call

      // Third call with same address - should still use cache
      const result3 = await isHypernativeGuard(guardAddress, mockProvider)
      expect(result3).toBe(true)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1) // Still only 1 call
    })

    it('should cache results independently for different addresses', async () => {
      mockProvider.getCode.mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE)

      const guardAddress1 = '0x1234567890123456789012345678901234567890'
      const guardAddress2 = '0x9876543210987654321098765432109876543210'

      // First address
      await isHypernativeGuard(guardAddress1, mockProvider)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1)

      // Second address - should make new call
      await isHypernativeGuard(guardAddress2, mockProvider)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2)

      // First address again - should use cache
      await isHypernativeGuard(guardAddress1, mockProvider)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2) // No new call

      // Second address again - should use cache
      await isHypernativeGuard(guardAddress2, mockProvider)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2) // No new call
    })

    it('should cache results even with different provider instances', async () => {
      const mockProvider1 = {
        getCode: jest.fn().mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE),
      } as unknown as jest.Mocked<JsonRpcProvider>

      const mockProvider2 = {
        getCode: jest.fn().mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE),
      } as unknown as jest.Mocked<JsonRpcProvider>

      const guardAddress = '0x1234567890123456789012345678901234567890'

      // Call with first provider
      const result1 = await isHypernativeGuard(guardAddress, mockProvider1)
      expect(result1).toBe(true)
      expect(mockProvider1.getCode).toHaveBeenCalledTimes(1)

      // Call with second provider - should still use cache (key is based on address only)
      const result2 = await isHypernativeGuard(guardAddress, mockProvider2)
      expect(result2).toBe(true)
      expect(mockProvider2.getCode).toHaveBeenCalledTimes(0) // Cached result used
    })

    it('should cache false results as well', async () => {
      mockProvider.getCode.mockResolvedValue(MOCK_OTHER_GUARD_BYTECODE)

      const guardAddress = '0x1234567890123456789012345678901234567890'

      // First call - returns false
      const result1 = await isHypernativeGuard(guardAddress, mockProvider)
      expect(result1).toBe(false)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1)

      // Second call - should use cached false result
      const result2 = await isHypernativeGuard(guardAddress, mockProvider)
      expect(result2).toBe(false)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1)
    })

    it('should cache null/undefined addresses separately', async () => {
      // Call with null
      const result1 = await isHypernativeGuard(null, mockProvider)
      expect(result1).toBe(false)

      // Call with undefined
      const result2 = await isHypernativeGuard(undefined, mockProvider)
      expect(result2).toBe(false)

      // Both should return quickly without RPC calls
      expect(mockProvider.getCode).not.toHaveBeenCalled()
    })
  })
})
