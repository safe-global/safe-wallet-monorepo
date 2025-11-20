import type { JsonRpcProvider } from 'ethers'
import { isHypernativeGuard, HYPERNATIVE_GUARD_FUNCTION_SELECTORS } from '../hypernativeGuardCheck'
import { logError, Errors } from '@/services/exceptions'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

/**
 * Helper to create mock bytecode with specific function selectors
 * Function selectors appear after PUSH4 (0x63) opcode in bytecode
 */
function createMockBytecode(selectors: string[]): string {
  let bytecode = '0x608060405234801561001057600080fd5b506004361061003657' // Standard contract preamble

  // Add each selector with PUSH4 opcode
  for (const selector of selectors) {
    const selectorHex = selector.startsWith('0x') ? selector.slice(2) : selector
    bytecode += '63' + selectorHex // 0x63 is PUSH4 opcode
  }

  bytecode += '00'.repeat(50) // Add some padding
  return bytecode
}

// Create mock bytecode with all HypernativeGuard selectors
const MOCK_HYPERNATIVE_GUARD_BYTECODE = createMockBytecode(HYPERNATIVE_GUARD_FUNCTION_SELECTORS)

// Create mock bytecode with no matching selectors
const MOCK_OTHER_GUARD_BYTECODE = createMockBytecode(['0x12345678', '0x9abcdef0'])

describe('isHypernativeGuard', () => {
  let mockProvider: jest.Mocked<JsonRpcProvider>

  beforeEach(() => {
    jest.clearAllMocks()

    // Clear memoization cache
    if (isHypernativeGuard.cache && typeof isHypernativeGuard.cache.clear === 'function') {
      isHypernativeGuard.cache.clear()
    }

    mockProvider = {
      getCode: jest.fn(),
    } as unknown as jest.Mocked<JsonRpcProvider>
  })

  afterEach(() => {
    // Clear memoization cache after each test
    if (isHypernativeGuard.cache && typeof isHypernativeGuard.cache.clear === 'function') {
      isHypernativeGuard.cache.clear()
    }
  })

  it('should return false if chainId is undefined', async () => {
    const result = await isHypernativeGuard(undefined, '0x1234567890123456789012345678901234567890', mockProvider)
    expect(result).toBe(false)
    expect(mockProvider.getCode).not.toHaveBeenCalled()
  })

  it('should return false if guardAddress is null', async () => {
    const result = await isHypernativeGuard('1', null, mockProvider)
    expect(result).toBe(false)
    expect(mockProvider.getCode).not.toHaveBeenCalled()
  })

  it('should return false if guardAddress is undefined', async () => {
    const result = await isHypernativeGuard('1', undefined, mockProvider)
    expect(result).toBe(false)
    expect(mockProvider.getCode).not.toHaveBeenCalled()
  })

  it('should return false if provider is undefined', async () => {
    const result = await isHypernativeGuard('1', '0x1234567890123456789012345678901234567890', undefined)
    expect(result).toBe(false)
  })

  it('should return false if the bytecode is empty', async () => {
    mockProvider.getCode.mockResolvedValue('0x')
    const result = await isHypernativeGuard('1', '0x1234567890123456789012345678901234567890', mockProvider)
    expect(result).toBe(false)
    expect(mockProvider.getCode).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890')
  })

  it('should return true if bytecode contains all HypernativeGuard function selectors', async () => {
    mockProvider.getCode.mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE)

    const result = await isHypernativeGuard('1', '0x1234567890123456789012345678901234567890', mockProvider)
    expect(result).toBe(true)
    expect(mockProvider.getCode).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890')
  })

  it('should return false if bytecode is missing even one HypernativeGuard selector', async () => {
    // Create bytecode with all selectors except one
    const selectorsToInclude = HYPERNATIVE_GUARD_FUNCTION_SELECTORS.slice(0, -1)
    const partialBytecode = createMockBytecode(selectorsToInclude)
    mockProvider.getCode.mockResolvedValue(partialBytecode)

    const result = await isHypernativeGuard('1', '0x1234567890123456789012345678901234567890', mockProvider)
    expect(result).toBe(false)
  })

  it('should return false if bytecode contains no matching selectors', async () => {
    mockProvider.getCode.mockResolvedValue(MOCK_OTHER_GUARD_BYTECODE)

    const result = await isHypernativeGuard('1', '0x1234567890123456789012345678901234567890', mockProvider)
    expect(result).toBe(false)
  })

  it('should throw error on provider failure and not cache it', async () => {
    mockProvider.getCode.mockRejectedValue(new Error('Network error'))

    await expect(isHypernativeGuard('1', '0x1234567890123456789012345678901234567890', mockProvider)).rejects.toThrow(
      'Network error',
    )

    expect(logError).toHaveBeenCalledWith(Errors._809, expect.any(Error))
  })

  describe('memoization', () => {
    beforeEach(() => {
      // Clear the memoization cache before each test
      if (isHypernativeGuard.cache && typeof isHypernativeGuard.cache.clear === 'function') {
        isHypernativeGuard.cache.clear()
      }
    })

    it('should cache results and not call provider.getCode again for the same chainId and address', async () => {
      mockProvider.getCode.mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE)

      const chainId = '1'
      const guardAddress = '0x1234567890123456789012345678901234567890'

      // First call
      const result1 = await isHypernativeGuard(chainId, guardAddress, mockProvider)
      expect(result1).toBe(true)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1)

      // Second call with same chainId and address - should use cache
      const result2 = await isHypernativeGuard(chainId, guardAddress, mockProvider)
      expect(result2).toBe(true)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1) // Still only 1 call

      // Third call with same chainId and address - should still use cache
      const result3 = await isHypernativeGuard(chainId, guardAddress, mockProvider)
      expect(result3).toBe(true)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1) // Still only 1 call
    })

    it('should cache results independently for different addresses', async () => {
      mockProvider.getCode.mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE)

      const chainId = '1'
      const guardAddress1 = '0x1234567890123456789012345678901234567890'
      const guardAddress2 = '0x9876543210987654321098765432109876543210'

      // First address
      await isHypernativeGuard(chainId, guardAddress1, mockProvider)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1)

      // Second address - should make new call
      await isHypernativeGuard(chainId, guardAddress2, mockProvider)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2)

      // First address again - should use cache
      await isHypernativeGuard(chainId, guardAddress1, mockProvider)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2) // No new call

      // Second address again - should use cache
      await isHypernativeGuard(chainId, guardAddress2, mockProvider)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2) // No new call
    })

    it('should cache results even with different provider instances', async () => {
      const mockProvider1 = {
        getCode: jest.fn().mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE),
      } as unknown as jest.Mocked<JsonRpcProvider>

      const mockProvider2 = {
        getCode: jest.fn().mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE),
      } as unknown as jest.Mocked<JsonRpcProvider>

      const chainId = '1'
      const guardAddress = '0x1234567890123456789012345678901234567890'

      // Call with first provider
      const result1 = await isHypernativeGuard(chainId, guardAddress, mockProvider1)
      expect(result1).toBe(true)
      expect(mockProvider1.getCode).toHaveBeenCalledTimes(1)

      // Call with second provider - should still use cache (key is based on chainId and address)
      const result2 = await isHypernativeGuard(chainId, guardAddress, mockProvider2)
      expect(result2).toBe(true)
      expect(mockProvider2.getCode).toHaveBeenCalledTimes(0) // Cached result used
    })

    it('should cache false results for non-HypernativeGuard contracts', async () => {
      mockProvider.getCode.mockResolvedValue(MOCK_OTHER_GUARD_BYTECODE)

      const chainId = '1'
      const guardAddress = '0x1234567890123456789012345678901234567890'

      // First call - returns false
      const result1 = await isHypernativeGuard(chainId, guardAddress, mockProvider)
      expect(result1).toBe(false)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1)

      // Second call - should use cached false result
      const result2 = await isHypernativeGuard(chainId, guardAddress, mockProvider)
      expect(result2).toBe(false)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1)
    })

    it('should not cache errors and allow retry', async () => {
      const chainId = '1'
      const guardAddress = '0x1234567890123456789012345678901234567890'

      // First call - throws error
      mockProvider.getCode.mockRejectedValueOnce(new Error('Network error'))
      await expect(isHypernativeGuard(chainId, guardAddress, mockProvider)).rejects.toThrow('Network error')
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1)

      // Second call - should retry (not cached)
      mockProvider.getCode.mockResolvedValueOnce(MOCK_HYPERNATIVE_GUARD_BYTECODE)

      const result = await isHypernativeGuard(chainId, guardAddress, mockProvider)
      expect(result).toBe(true)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2) // Called again, not cached
    })

    it('should cache results separately for different chainIds', async () => {
      mockProvider.getCode.mockResolvedValue(MOCK_HYPERNATIVE_GUARD_BYTECODE)

      const guardAddress = '0x1234567890123456789012345678901234567890'
      const chainId1 = '1'
      const chainId2 = '11155111'

      // First chainId
      await isHypernativeGuard(chainId1, guardAddress, mockProvider)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1)

      // Different chainId - should make new call
      await isHypernativeGuard(chainId2, guardAddress, mockProvider)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2)

      // First chainId again - should use cache
      await isHypernativeGuard(chainId1, guardAddress, mockProvider)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2) // No new call
    })

    it('should cache null/undefined addresses separately', async () => {
      // Call with null chainId
      const result1 = await isHypernativeGuard(undefined, '0x1234567890123456789012345678901234567890', mockProvider)
      expect(result1).toBe(false)

      // Call with null address
      const result2 = await isHypernativeGuard('1', null, mockProvider)
      expect(result2).toBe(false)

      // Call with undefined address
      const result3 = await isHypernativeGuard('1', undefined, mockProvider)
      expect(result3).toBe(false)

      // All should return quickly without RPC calls
      expect(mockProvider.getCode).not.toHaveBeenCalled()
    })
  })

  describe('skipAbiCheck parameter', () => {
    beforeEach(() => {
      // Clear the cache before each test
      if (isHypernativeGuard.cache && typeof isHypernativeGuard.cache.clear === 'function') {
        isHypernativeGuard.cache.clear()
      }
    })

    it('should return true for any guard when skipAbiCheck is true', async () => {
      // Use bytecode that doesn't match HypernativeGuard selectors
      mockProvider.getCode.mockResolvedValue(MOCK_OTHER_GUARD_BYTECODE)

      const result = await isHypernativeGuard('1', '0x1234567890123456789012345678901234567890', mockProvider, true)

      // Should return true because skipAbiCheck is enabled and contract has code
      expect(result).toBe(true)
      expect(mockProvider.getCode).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890')
    })

    it('should perform ABI check when skipAbiCheck is false (default)', async () => {
      // Use bytecode that doesn't match HypernativeGuard selectors
      mockProvider.getCode.mockResolvedValue(MOCK_OTHER_GUARD_BYTECODE)

      const result = await isHypernativeGuard('1', '0x1234567890123456789012345678901234567890', mockProvider, false)

      // Should return false because ABI check fails
      expect(result).toBe(false)
    })

    it('should still return false for empty bytecode even when skipAbiCheck is true', async () => {
      // No code at address
      mockProvider.getCode.mockResolvedValue('0x')

      const result = await isHypernativeGuard('1', '0x1234567890123456789012345678901234567890', mockProvider, true)

      // Should return false because no code exists
      expect(result).toBe(false)
    })

    it('should cache results separately for different skipAbiCheck values', async () => {
      mockProvider.getCode.mockResolvedValue(MOCK_OTHER_GUARD_BYTECODE)

      const chainId = '1'
      const guardAddress = '0x1234567890123456789012345678901234567890'

      // Call with skipAbiCheck = false
      const result1 = await isHypernativeGuard(chainId, guardAddress, mockProvider, false)
      expect(result1).toBe(false)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(1)

      // Call with skipAbiCheck = true - should make new call since cache key is different
      const result2 = await isHypernativeGuard(chainId, guardAddress, mockProvider, true)
      expect(result2).toBe(true)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2)

      // Call with skipAbiCheck = false again - should use cache
      const result3 = await isHypernativeGuard(chainId, guardAddress, mockProvider, false)
      expect(result3).toBe(false)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2) // No new call

      // Call with skipAbiCheck = true again - should use cache
      const result4 = await isHypernativeGuard(chainId, guardAddress, mockProvider, true)
      expect(result4).toBe(true)
      expect(mockProvider.getCode).toHaveBeenCalledTimes(2) // No new call
    })
  })
})
