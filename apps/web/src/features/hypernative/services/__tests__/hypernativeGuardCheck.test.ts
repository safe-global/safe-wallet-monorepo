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
})
