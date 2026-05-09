import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import type { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeInfo } from '@/src/types/address'
import { executePrivateKeyTx } from './privateKeyExecutor'
import { createMockChain, createMockSafeInfo } from '@safe-global/test'

const mockExecuteTx = jest.fn()
const mockGetUserNonce = jest.fn()
const mockGetPrivateKey = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('@/src/services/tx/tx-sender/execute', () => ({
  executeTx: (...args: unknown[]) => mockExecuteTx(...args),
}))

jest.mock('@/src/services/web3', () => ({
  getUserNonce: (...args: unknown[]) => mockGetUserNonce(...args),
}))

jest.mock('@/src/hooks/useSign/useSign', () => ({
  getPrivateKey: (...args: unknown[]) => mockGetPrivateKey(...args),
}))

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}))

describe('executePrivateKeyTx', () => {
  const mockChain: Chain = createMockChain()
  const mockActiveSafe: SafeInfo = createMockSafeInfo()

  const mockFeeParams: EstimatedFeeValues = {
    maxFeePerGas: BigInt('1000000000'),
    maxPriorityFeePerGas: BigInt('100000000'),
    gasLimit: BigInt('21000'),
    nonce: 5,
  }

  const defaultParams = {
    chain: mockChain,
    activeSafe: mockActiveSafe,
    txId: 'tx123',
    signerAddress: '0xSignerAddress',
    feeParams: mockFeeParams,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPrivateKey.mockResolvedValue('0xPrivateKey123')
    mockGetUserNonce.mockResolvedValue(10)
    mockExecuteTx.mockResolvedValue({ hash: '0xTransactionHash' })
  })

  describe('success cases', () => {
    it('should execute transaction successfully with private key', async () => {
      const result = await executePrivateKeyTx(defaultParams)

      expect(mockGetPrivateKey).toHaveBeenCalledWith('0xSignerAddress')
      expect(mockGetUserNonce).toHaveBeenCalledWith(mockChain, '0xSignerAddress')
      expect(mockExecuteTx).toHaveBeenCalledWith({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: 'tx123',
        privateKey: '0xPrivateKey123',
        feeParams: mockFeeParams,
      })

      expect(result).toEqual({
        type: ExecutionMethod.WITH_PK,
        txId: 'tx123',
        chainId: mockActiveSafe.chainId,
        safeAddress: mockActiveSafe.address,
        txHash: '0xTransactionHash',
        walletAddress: '0xSignerAddress',
        walletNonce: 10,
      })
    })

    it('should handle null feeParams', async () => {
      const result = await executePrivateKeyTx({
        ...defaultParams,
        feeParams: null,
      })

      expect(mockExecuteTx).toHaveBeenCalledWith(
        expect.objectContaining({
          feeParams: null,
        }),
      )
      expect(result).toBeDefined()
      expect(result.txHash).toBe('0xTransactionHash')
    })
  })

  describe('error cases', () => {
    it('should throw and log error when getPrivateKey fails', async () => {
      const keyError = new Error('Failed to load key')
      mockGetPrivateKey.mockRejectedValue(keyError)

      await expect(executePrivateKeyTx(defaultParams)).rejects.toThrow('Failed to load key')

      expect(mockLoggerError).toHaveBeenCalledWith('Error loading private key:', keyError)
      expect(mockExecuteTx).not.toHaveBeenCalled()
      expect(mockGetUserNonce).not.toHaveBeenCalled()
    })

    it('should throw error when private key is not found (null)', async () => {
      mockGetPrivateKey.mockResolvedValue(null)

      await expect(executePrivateKeyTx(defaultParams)).rejects.toThrow('Private key not found')

      expect(mockExecuteTx).not.toHaveBeenCalled()
      expect(mockGetUserNonce).not.toHaveBeenCalled()
    })

    it('should throw error when private key is not found (undefined)', async () => {
      mockGetPrivateKey.mockResolvedValue(undefined)

      await expect(executePrivateKeyTx(defaultParams)).rejects.toThrow('Private key not found')

      expect(mockExecuteTx).not.toHaveBeenCalled()
    })

    it('should propagate error from getUserNonce', async () => {
      const nonceError = new Error('Failed to get nonce')
      mockGetUserNonce.mockRejectedValue(nonceError)

      await expect(executePrivateKeyTx(defaultParams)).rejects.toThrow('Failed to get nonce')

      expect(mockGetPrivateKey).toHaveBeenCalled()
      expect(mockExecuteTx).not.toHaveBeenCalled()
    })

    it('should propagate error from executeTx', async () => {
      const executionError = new Error('Execution failed')
      mockExecuteTx.mockRejectedValue(executionError)

      await expect(executePrivateKeyTx(defaultParams)).rejects.toThrow('Execution failed')

      expect(mockGetPrivateKey).toHaveBeenCalled()
      expect(mockGetUserNonce).toHaveBeenCalled()
    })
  })

  describe('execution flow', () => {
    it('should call services in correct order', async () => {
      const callOrder: string[] = []

      mockGetPrivateKey.mockImplementation(async () => {
        callOrder.push('getPrivateKey')
        return '0xPrivateKey'
      })
      mockGetUserNonce.mockImplementation(async () => {
        callOrder.push('getUserNonce')
        return 10
      })
      mockExecuteTx.mockImplementation(async () => {
        callOrder.push('executeTx')
        return { hash: '0xHash' }
      })

      await executePrivateKeyTx(defaultParams)

      expect(callOrder).toEqual(['getPrivateKey', 'getUserNonce', 'executeTx'])
    })
  })
})
