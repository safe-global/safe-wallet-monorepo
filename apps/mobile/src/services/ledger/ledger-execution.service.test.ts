import type { SafeInfo } from '@/src/types/address'
import type { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import { LedgerExecutionService } from './ledger-execution.service'
import {
  generateChecksummedAddress,
  createMockChain,
  createMockSafeInfo,
  createMockSafeTx,
  createMockProtocolKit,
  createMockProvider,
} from '@safe-global/test'

const mockGetCurrentSession = jest.fn()
const mockSignTransaction = jest.fn()
const mockCreateWeb3ReadOnly = jest.fn()
const mockFetchTransactionDetails = jest.fn()
const mockExtractTxInfo = jest.fn()
const mockCreateExistingTx = jest.fn()
const mockGetSafeSDK = jest.fn()
const mockLoggerError = jest.fn()
const mockLoggerInfo = jest.fn()

jest.mock('./ledger-dmk.service', () => ({
  ledgerDMKService: {
    getCurrentSession: () => mockGetCurrentSession(),
  },
}))

jest.mock('./ledger-ethereum.service', () => ({
  ledgerEthereumService: {
    signTransaction: (...args: unknown[]) => mockSignTransaction(...args),
  },
}))

jest.mock('@/src/services/web3', () => ({
  createWeb3ReadOnly: (...args: unknown[]) => mockCreateWeb3ReadOnly(...args),
}))

jest.mock('../tx/fetchTransactionDetails', () => ({
  fetchTransactionDetails: (...args: unknown[]) => mockFetchTransactionDetails(...args),
}))

jest.mock('../tx/extractTx', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockExtractTxInfo(...args),
}))

jest.mock('../tx/tx-sender/create', () => ({
  createExistingTx: (...args: unknown[]) => mockCreateExistingTx(...args),
}))

jest.mock('@/src/hooks/coreSDK/safeCoreSDK', () => ({
  getSafeSDK: () => mockGetSafeSDK(),
}))

jest.mock('@safe-global/protocol-kit/dist/src/utils', () => ({
  generatePreValidatedSignature: (owner: string) => ({ signer: owner, data: '0xPreValidated' }),
}))

jest.mock('ethers', () => ({
  Transaction: {
    from: jest.fn().mockImplementation((data) => ({
      ...data,
      unsignedSerialized: '0x1234',
      serialized: '0x5678',
      signature: null,
    })),
  },
}))

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    info: (...args: unknown[]) => mockLoggerInfo(...args),
  },
}))

describe('LedgerExecutionService', () => {
  const mockSessionId = 'session-123'
  const mockChain = createMockChain()
  const mockActiveSafe: SafeInfo = createMockSafeInfo()

  const mockFeeParams: EstimatedFeeValues = {
    maxFeePerGas: BigInt('2000000000'),
    maxPriorityFeePerGas: BigInt('1000000000'),
    gasLimit: BigInt('100000'),
    nonce: 5,
  }

  const mockTxParams = {
    to: generateChecksummedAddress(),
    value: '1000000000000000000',
    data: '0x',
    nonce: 1,
  }

  const mockSignatures = {
    [generateChecksummedAddress()]: '0xSignature1',
  }

  const mockSafeTx = {
    ...createMockSafeTx(),
    data: mockTxParams,
    signatures: new Map([['0xowner1', { data: '0xSig1' }]]),
  }

  const mockSafeSDK = createMockProtocolKit()
  const mockProvider = createMockProvider()

  const defaultParams = {
    chain: mockChain,
    activeSafe: mockActiveSafe,
    txId: 'tx123',
    signerAddress: generateChecksummedAddress(),
    derivationPath: "44'/60'/0'/0/0",
    feeParams: mockFeeParams,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockGetCurrentSession.mockReturnValue(mockSessionId)
    mockGetSafeSDK.mockReturnValue(mockSafeSDK)
    mockCreateWeb3ReadOnly.mockReturnValue(mockProvider)
    mockFetchTransactionDetails.mockResolvedValue({ id: 'tx123' })
    mockExtractTxInfo.mockReturnValue({ txParams: mockTxParams, signatures: mockSignatures })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)
    mockSignTransaction.mockResolvedValue(
      '0x' + 'a'.repeat(64) + 'b'.repeat(64) + '1b', // r + s + v
    )
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LedgerExecutionService.getInstance()
      const instance2 = LedgerExecutionService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe('ensureLedgerConnection', () => {
    it('should not throw when session exists', async () => {
      const service = LedgerExecutionService.getInstance()

      await expect(service.ensureLedgerConnection()).resolves.toBeUndefined()
    })

    it('should throw when no session exists', async () => {
      mockGetCurrentSession.mockReturnValue(null)

      const service = LedgerExecutionService.getInstance()

      await expect(service.ensureLedgerConnection()).rejects.toThrow('No active Ledger session found')
    })
  })

  describe('executeTransaction', () => {
    it('should execute transaction successfully', async () => {
      const service = LedgerExecutionService.getInstance()
      const result = await service.executeTransaction(defaultParams)

      expect(result.hash).toBeDefined()
      expect(mockFetchTransactionDetails).toHaveBeenCalledWith('1', 'tx123')
      expect(mockExtractTxInfo).toHaveBeenCalled()
      expect(mockCreateExistingTx).toHaveBeenCalled()
      expect(mockSignTransaction).toHaveBeenCalled()
      expect(mockProvider.broadcastTransaction).toHaveBeenCalled()
    })

    it('should use provided fee params', async () => {
      const service = LedgerExecutionService.getInstance()
      await service.executeTransaction(defaultParams)

      expect(mockProvider.getTransactionCount).not.toHaveBeenCalled()
      expect(mockProvider.getFeeData).not.toHaveBeenCalled()
      expect(mockProvider.estimateGas).not.toHaveBeenCalled()
    })

    it('should fetch fee params from provider when not provided', async () => {
      const service = LedgerExecutionService.getInstance()
      await service.executeTransaction({
        ...defaultParams,
        feeParams: undefined,
      })

      expect(mockProvider.getTransactionCount).toHaveBeenCalled()
      expect(mockProvider.getFeeData).toHaveBeenCalled()
      expect(mockProvider.estimateGas).toHaveBeenCalled()
    })

    it('should throw when no Ledger session', async () => {
      mockGetCurrentSession.mockReturnValue(null)

      const service = LedgerExecutionService.getInstance()

      await expect(service.executeTransaction(defaultParams)).rejects.toThrow('No active Ledger session found')
    })

    it('should throw when Safe SDK not initialized', async () => {
      mockGetSafeSDK.mockReturnValue(null)

      const service = LedgerExecutionService.getInstance()

      await expect(service.executeTransaction(defaultParams)).rejects.toThrow('Safe SDK not initialized')
    })

    it('should throw when provider creation fails', async () => {
      mockCreateWeb3ReadOnly.mockReturnValue(null)

      const service = LedgerExecutionService.getInstance()

      await expect(service.executeTransaction(defaultParams)).rejects.toThrow('Failed to create provider')
    })

    it('should throw when not enough signatures', async () => {
      mockSafeSDK.getThreshold.mockResolvedValue(3)
      mockSafeSDK.getOwners.mockResolvedValue([generateChecksummedAddress()])

      const service = LedgerExecutionService.getInstance()

      await expect(service.executeTransaction(defaultParams)).rejects.toThrow('signature')
    })

    it('should add pre-validated signatures for owners who approved', async () => {
      mockSafeSDK.getThreshold.mockResolvedValue(1)
      mockSafeSDK.getOwnersWhoApprovedTx.mockResolvedValue([generateChecksummedAddress()])
      mockSafeTx.signatures = new Map([['0xowner1', { data: '0xSig1' }]])

      const service = LedgerExecutionService.getInstance()
      await service.executeTransaction(defaultParams)

      expect(mockSafeTx.addSignature).toHaveBeenCalled()
    })

    it('should log transaction info', async () => {
      mockSafeSDK.getThreshold.mockResolvedValue(1)
      mockSafeTx.signatures = new Map([['0xowner1', { data: '0xSig1' }]])

      const service = LedgerExecutionService.getInstance()
      await service.executeTransaction(defaultParams)

      expect(mockLoggerInfo).toHaveBeenCalledWith('Signing transaction with Ledger', expect.any(Object))
      expect(mockLoggerInfo).toHaveBeenCalledWith('Sending signed transaction', expect.any(Object))
      expect(mockLoggerInfo).toHaveBeenCalledWith('Transaction executed successfully', expect.any(Object))
    })

    it('should log error on failure', async () => {
      mockSignTransaction.mockRejectedValue(new Error('User rejected'))

      const service = LedgerExecutionService.getInstance()

      await expect(service.executeTransaction(defaultParams)).rejects.toThrow()
      expect(mockLoggerError).toHaveBeenCalled()
    })
  })
})
