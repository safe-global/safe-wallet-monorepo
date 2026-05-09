import { encodeEIP1271Signature, signProposerTypedDataForSafe } from './utils'
import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import type { JsonRpcSigner } from 'ethers'
import * as web3Utils from '@safe-global/utils/utils/web3'
import * as delegateUtils from '@safe-global/utils/services/delegates'

describe('encodeEIP1271Signature', () => {
  const parentSafeAddress = getAddress(faker.finance.ethereumAddress())
  // A typical 65-byte ECDSA signature (r + s + v)
  const ownerSignature =
    '0x' +
    'a'.repeat(64) + // r (32 bytes)
    'b'.repeat(64) + // s (32 bytes)
    '1c' // v (1 byte = 28)

  it('should return a valid hex string', async () => {
    const result = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    expect(result).toMatch(/^0x[0-9a-fA-F]+$/)
  })

  it('should contain the parent Safe address left-padded to 32 bytes in the r-value', async () => {
    const result = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    // r is bytes 0-31 (hex chars 2-66, after "0x")
    const rValue = result.slice(2, 66)

    // parentSafeAddress is 20 bytes, left-padded with 12 zero bytes (24 hex chars)
    const expectedR = '0'.repeat(24) + parentSafeAddress.slice(2).toLowerCase()

    expect(rValue.toLowerCase()).toBe(expectedR.toLowerCase())
  })

  it('should have s-value of 65 (0x41) left-padded to 32 bytes', async () => {
    const result = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    // s is bytes 32-63 (hex chars 66-130)
    const sValue = result.slice(66, 130)

    // 65 decimal = 0x41, left-padded to 32 bytes
    const expectedS = '0'.repeat(62) + '41'

    expect(sValue).toBe(expectedS)
  })

  it('should have v-value of 0x00 (contract signature type)', async () => {
    const result = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    // v is byte 64 (hex chars 130-132)
    const vValue = result.slice(130, 132)

    expect(vValue).toBe('00')
  })

  it('should include length-prefixed owner signature in the dynamic data portion', async () => {
    const result = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    // Dynamic data starts at byte 65 (hex char 132)
    const dynamicData = result.slice(132)

    // The dynamic data contains the length-prefixed owner signature
    // Length of ownerSignature = 65 bytes = 0x41
    const lengthHex = dynamicData.slice(0, 64)
    expect(parseInt(lengthHex, 16)).toBe(65) // 65 bytes for ECDSA signature

    // The actual signature data follows the length
    const sigData = dynamicData.slice(64, 64 + 130) // 65 bytes = 130 hex chars
    expect(sigData.toLowerCase()).toBe(ownerSignature.slice(2).toLowerCase())
  })

  it('should produce consistent output for the same inputs', async () => {
    const result1 = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)
    const result2 = await encodeEIP1271Signature(parentSafeAddress, ownerSignature)

    expect(result1).toBe(result2)
  })

  it('should correctly encode multi-owner preparedSignature (2 concatenated 65-byte signatures)', async () => {
    // Two 65-byte signatures concatenated (as returned by preparedSignature for a 2/N Safe)
    const sig1 = 'a'.repeat(64) + 'b'.repeat(64) + '1b' // 65 bytes
    const sig2 = 'c'.repeat(64) + 'd'.repeat(64) + '1c' // 65 bytes
    const multiOwnerSignature = '0x' + sig1 + sig2 // 130 bytes total

    const result = await encodeEIP1271Signature(parentSafeAddress, multiOwnerSignature)

    expect(result).toMatch(/^0x[0-9a-fA-F]+$/)

    // r: parent Safe address
    const rValue = result.slice(2, 66)
    const expectedR = '0'.repeat(24) + parentSafeAddress.slice(2).toLowerCase()
    expect(rValue.toLowerCase()).toBe(expectedR.toLowerCase())

    // s: offset 65
    const sValue = result.slice(66, 130)
    expect(sValue).toBe('0'.repeat(62) + '41')

    // v: 0x00
    expect(result.slice(130, 132)).toBe('00')

    // Dynamic data: length should be 130 bytes (2 * 65)
    const dynamicData = result.slice(132)
    const lengthHex = dynamicData.slice(0, 64)
    expect(parseInt(lengthHex, 16)).toBe(130)

    // The actual multi-owner signature data
    const sigData = dynamicData.slice(64, 64 + 260) // 130 bytes = 260 hex chars
    expect(sigData.toLowerCase()).toBe((sig1 + sig2).toLowerCase())
  })

  it('should correctly encode multi-owner preparedSignature (3 concatenated 65-byte signatures)', async () => {
    // Three 65-byte signatures concatenated (as returned by preparedSignature for a 3/N Safe)
    const sig1 = '1'.repeat(130) // 65 bytes
    const sig2 = '2'.repeat(130) // 65 bytes
    const sig3 = '3'.repeat(130) // 65 bytes
    const multiOwnerSignature = '0x' + sig1 + sig2 + sig3 // 195 bytes total

    const result = await encodeEIP1271Signature(parentSafeAddress, multiOwnerSignature)

    // Dynamic data: length should be 195 bytes
    const dynamicData = result.slice(132)
    const lengthHex = dynamicData.slice(0, 64)
    expect(parseInt(lengthHex, 16)).toBe(195)

    // The actual multi-owner signature data
    const sigData = dynamicData.slice(64, 64 + 390) // 195 bytes = 390 hex chars
    expect(sigData.toLowerCase()).toBe((sig1 + sig2 + sig3).toLowerCase())
  })
})

describe('signProposerTypedDataForSafe', () => {
  const mockChainId = '11155111'
  const mockProposerAddress = getAddress(faker.finance.ethereumAddress())
  const mockParentSafeAddress = getAddress(faker.finance.ethereumAddress())
  const mockSignature = '0x' + 'ab'.repeat(65)
  const mockDelegateHash = '0x' + 'dd'.repeat(32)
  const mockSigner = {} as JsonRpcSigner

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should hash the delegate typed data and sign the SafeMessage-wrapped hash', async () => {
    jest.spyOn(web3Utils, 'hashTypedData').mockReturnValue(mockDelegateHash)
    jest.spyOn(web3Utils, 'signTypedData').mockResolvedValue(mockSignature)

    const result = await signProposerTypedDataForSafe(
      mockChainId,
      mockProposerAddress,
      mockParentSafeAddress,
      mockSigner,
    )

    // Should hash the delegate typed data first
    expect(web3Utils.hashTypedData).toHaveBeenCalledWith(
      delegateUtils.getDelegateTypedData(mockChainId, mockProposerAddress),
    )

    // Should sign the SafeMessage typed data (not the raw delegate typed data)
    expect(web3Utils.signTypedData).toHaveBeenCalledWith(
      mockSigner,
      expect.objectContaining({
        domain: {
          verifyingContract: mockParentSafeAddress,
          chainId: Number(mockChainId),
        },
        types: {
          SafeMessage: [{ type: 'bytes', name: 'message' }],
        },
        message: {
          message: mockDelegateHash,
        },
        primaryType: 'SafeMessage',
      }),
    )

    expect(result).toBe(mockSignature)
  })

  it('should use the correct parent Safe address in the domain', async () => {
    const specificParentSafe = getAddress(faker.finance.ethereumAddress())
    jest.spyOn(web3Utils, 'hashTypedData').mockReturnValue(mockDelegateHash)
    jest.spyOn(web3Utils, 'signTypedData').mockResolvedValue(mockSignature)

    await signProposerTypedDataForSafe(mockChainId, mockProposerAddress, specificParentSafe, mockSigner)

    expect(web3Utils.signTypedData).toHaveBeenCalledWith(
      mockSigner,
      expect.objectContaining({
        domain: expect.objectContaining({
          verifyingContract: specificParentSafe,
        }),
      }),
    )
  })

  it('should use the correct chainId in the domain', async () => {
    jest.spyOn(web3Utils, 'hashTypedData').mockReturnValue(mockDelegateHash)
    jest.spyOn(web3Utils, 'signTypedData').mockResolvedValue(mockSignature)

    await signProposerTypedDataForSafe('1', mockProposerAddress, mockParentSafeAddress, mockSigner)

    expect(web3Utils.signTypedData).toHaveBeenCalledWith(
      mockSigner,
      expect.objectContaining({
        domain: expect.objectContaining({
          chainId: 1,
        }),
      }),
    )
  })
})
