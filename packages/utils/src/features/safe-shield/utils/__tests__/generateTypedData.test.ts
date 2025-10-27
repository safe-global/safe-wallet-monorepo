import { generateTypedData } from '../generateTypedData'
import { generateTypedData as generateTypedDataProtocolKit } from '@safe-global/protocol-kit'
import { isEIP712TypedData } from '../../../../utils/safe-messages'
import { normalizeTypedData } from '../../../../utils/web3'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'
import { faker } from '@faker-js/faker/.'

jest.mock('@safe-global/protocol-kit')
jest.mock('../../../../utils/safe-messages')
jest.mock('../../../../utils/web3')

const mockIsEIP712TypedData = isEIP712TypedData as unknown as jest.Mock
const mockNormalizeTypedData = normalizeTypedData as unknown as jest.Mock
const mockGenerateTypedDataProtocolKit = generateTypedDataProtocolKit as unknown as jest.Mock

describe('generateTypedData', () => {
  const mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`
  const mockChainId = '1'
  const mockSafeVersion = '1.4.1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when data is TypedData (EIP-712)', () => {
    it('should normalize and return TypedData directly', () => {
      const mockTypedData: TypedData = {
        domain: {
          chainId: 1,
          verifyingContract: mockSafeAddress,
        },
        primaryType: 'SafeTx',
        types: {
          SafeTx: [
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
          ],
        },
        message: {
          to: faker.finance.ethereumAddress(),
          value: '100',
        },
      }

      const normalizedTypedData: TypedData = {
        ...mockTypedData,
        domain: {
          ...mockTypedData.domain,
          chainId: Number(mockChainId),
        },
      }

      mockIsEIP712TypedData.mockReturnValue(true)
      mockNormalizeTypedData.mockReturnValue(normalizedTypedData)

      const result = generateTypedData({
        data: mockTypedData,
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        safeVersion: mockSafeVersion,
      })

      expect(isEIP712TypedData).toHaveBeenCalledWith(mockTypedData)
      expect(normalizeTypedData).toHaveBeenCalledWith(mockTypedData)
      expect(result).toEqual(normalizedTypedData)
      expect(generateTypedDataProtocolKit).not.toHaveBeenCalled()
    })

    it('should handle TypedData without calling protocol-kit', () => {
      const mockTypedData: TypedData = {
        domain: { chainId: 5 },
        primaryType: 'Message',
        types: { Message: [{ name: 'content', type: 'string' }] },
        message: { content: 'test' },
      }

      mockIsEIP712TypedData.mockReturnValue(true)
      mockNormalizeTypedData.mockReturnValue(mockTypedData)

      generateTypedData({
        data: mockTypedData,
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
      })

      expect(generateTypedDataProtocolKit).not.toHaveBeenCalled()
    })
  })

  describe('when data is SafeTransaction', () => {
    const mockSafeTransaction: SafeTransaction = {
      data: {
        to: faker.finance.ethereumAddress(),
        value: '1000000000000000000',
        data: '0x',
        operation: 0,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: 1,
      },
      signatures: new Map(),
      getSignature: jest.fn(),
      addSignature: jest.fn(),
      encodedSignatures: jest.fn(),
    }

    const mockGeneratedTypedData: TypedData = {
      domain: {
        chainId: 0, // Initial value from protocol-kit
        verifyingContract: mockSafeAddress,
      },
      primaryType: 'SafeTx',
      types: {
        SafeTx: [
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' },
        ],
      },
      message: {
        to: mockSafeTransaction.data.to,
        value: mockSafeTransaction.data.value,
        data: mockSafeTransaction.data.data,
      },
    }

    beforeEach(() => {
      mockIsEIP712TypedData.mockReturnValue(false)
      mockGenerateTypedDataProtocolKit.mockReturnValue(mockGeneratedTypedData)
    })

    it('should generate TypedData using protocol-kit and set domain chainId', () => {
      const result = generateTypedData({
        data: mockSafeTransaction,
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        safeVersion: mockSafeVersion,
      })

      expect(isEIP712TypedData).toHaveBeenCalledWith(mockSafeTransaction)
      expect(generateTypedDataProtocolKit).toHaveBeenCalledWith({
        safeAddress: mockSafeAddress,
        safeVersion: mockSafeVersion,
        chainId: BigInt(mockChainId),
        data: mockSafeTransaction.data,
      })
      expect(result.domain.chainId).toBe(Number(mockChainId))
      expect(normalizeTypedData).not.toHaveBeenCalled()
    })

    it('should use default Safe version when not provided', () => {
      generateTypedData({
        data: mockSafeTransaction,
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
      })

      expect(generateTypedDataProtocolKit).toHaveBeenCalledWith({
        safeAddress: mockSafeAddress,
        safeVersion: '1.3.0', // DEFAULT_SAFE_VERSION
        chainId: BigInt(mockChainId),
        data: mockSafeTransaction.data,
      })
    })

    it('should handle different chain IDs correctly', () => {
      const testChainId = '137' // Polygon

      const result = generateTypedData({
        data: mockSafeTransaction,
        safeAddress: mockSafeAddress,
        chainId: testChainId,
        safeVersion: mockSafeVersion,
      })

      expect(generateTypedDataProtocolKit).toHaveBeenCalledWith({
        safeAddress: mockSafeAddress,
        safeVersion: mockSafeVersion,
        chainId: BigInt(testChainId),
        data: mockSafeTransaction.data,
      })
      expect(result.domain.chainId).toBe(137)
    })

    it('should use custom Safe version when provided', () => {
      const customVersion = '1.5.0'

      generateTypedData({
        data: mockSafeTransaction,
        safeAddress: mockSafeAddress,
        chainId: mockChainId,
        safeVersion: customVersion,
      })

      expect(generateTypedDataProtocolKit).toHaveBeenCalledWith({
        safeAddress: mockSafeAddress,
        safeVersion: customVersion,
        chainId: BigInt(mockChainId),
        data: mockSafeTransaction.data,
      })
    })

    it('should correctly convert chainId from string to BigInt and back to number', () => {
      const result = generateTypedData({
        data: mockSafeTransaction,
        safeAddress: mockSafeAddress,
        chainId: '42161', // Arbitrum
        safeVersion: mockSafeVersion,
      })

      // Verify BigInt conversion
      expect(generateTypedDataProtocolKit).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: BigInt('42161'),
        }),
      )

      // Verify final number conversion
      expect(result.domain.chainId).toBe(42161)
    })
  })
})
