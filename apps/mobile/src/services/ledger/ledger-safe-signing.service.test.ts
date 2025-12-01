import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeInfo } from '@/src/types/address'
import type { SafeVersion } from '@safe-global/types-kit'
import { LedgerSafeSigningService } from './ledger-safe-signing.service'

const mockGetCurrentSession = jest.fn()
const mockSignTypedData = jest.fn()
const mockFetchTransactionDetails = jest.fn()
const mockExtractTxInfo = jest.fn()
const mockCreateExistingTx = jest.fn()
const mockGenerateTypedData = jest.fn()
const mockLoggerError = jest.fn()
const mockLoggerInfo = jest.fn()
const mockTypedDataEncoderHash = jest.fn()

jest.mock('./ledger-dmk.service', () => ({
  ledgerDMKService: {
    getCurrentSession: () => mockGetCurrentSession(),
  },
}))

jest.mock('./ledger-ethereum.service', () => ({
  ledgerEthereumService: {
    signTypedData: (...args: unknown[]) => mockSignTypedData(...args),
  },
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

jest.mock('@safe-global/protocol-kit/dist/src/utils/eip-712', () => ({
  generateTypedData: (...args: unknown[]) => mockGenerateTypedData(...args),
}))

jest.mock('ethers', () => ({
  TypedDataEncoder: {
    hash: (...args: unknown[]) => mockTypedDataEncoderHash(...args),
  },
}))

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => mockLoggerError(...args),
    info: (...args: unknown[]) => mockLoggerInfo(...args),
  },
}))

describe('LedgerSafeSigningService', () => {
  const mockSessionId = 'session-123'

  const mockChain: Chain = {
    chainId: '1',
    chainName: 'Ethereum',
  } as Chain

  const mockActiveSafe: SafeInfo = {
    address: '0xSafeAddress',
    chainId: '1',
  }

  const mockTxParams = {
    to: '0xRecipient',
    value: '1000000000000000000',
    data: '0x',
    nonce: 1,
  }

  const mockSignatures = {
    '0xOwner1': '0xSignature1',
  }

  const mockSafeTx = {
    data: mockTxParams,
  }

  const mockTypedData = {
    domain: {
      verifyingContract: '0xSafeAddress',
      chainId: 1n,
    },
    types: {
      EIP712Domain: [{ name: 'verifyingContract', type: 'address' }],
      SafeTx: [{ name: 'to', type: 'address' }],
    },
    primaryType: 'SafeTx',
    message: { to: '0xRecipient' },
  }

  const defaultParams = {
    chain: mockChain,
    activeSafe: mockActiveSafe,
    txId: 'tx123',
    signerAddress: '0xSignerAddress',
    derivationPath: "44'/60'/0'/0/0",
    safeVersion: '1.3.0' as SafeVersion,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockGetCurrentSession.mockReturnValue(mockSessionId)
    mockFetchTransactionDetails.mockResolvedValue({ id: 'tx123' })
    mockExtractTxInfo.mockReturnValue({ txParams: mockTxParams, signatures: mockSignatures })
    mockCreateExistingTx.mockResolvedValue(mockSafeTx)
    mockGenerateTypedData.mockReturnValue(mockTypedData)
    mockTypedDataEncoderHash.mockReturnValue('0xSafeTransactionHash')
    mockSignTypedData.mockResolvedValue('0x' + 'a'.repeat(130))
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LedgerSafeSigningService.getInstance()
      const instance2 = LedgerSafeSigningService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe('signSafeTransaction', () => {
    it('should sign transaction successfully', async () => {
      const service = LedgerSafeSigningService.getInstance()
      const result = await service.signSafeTransaction(defaultParams)

      expect(result.signature).toMatch(/^0x[a-fA-F0-9]+$/)
      expect(result.safeTransactionHash).toBe('0xSafeTransactionHash')
    })

    it('should fetch transaction details', async () => {
      const service = LedgerSafeSigningService.getInstance()
      await service.signSafeTransaction(defaultParams)

      expect(mockFetchTransactionDetails).toHaveBeenCalledWith('1', 'tx123')
    })

    it('should extract tx info from details', async () => {
      const service = LedgerSafeSigningService.getInstance()
      await service.signSafeTransaction(defaultParams)

      expect(mockExtractTxInfo).toHaveBeenCalled()
    })

    it('should create existing tx with signatures', async () => {
      const service = LedgerSafeSigningService.getInstance()
      await service.signSafeTransaction(defaultParams)

      expect(mockCreateExistingTx).toHaveBeenCalledWith(mockTxParams, mockSignatures)
    })

    it('should generate typed data for signing', async () => {
      const service = LedgerSafeSigningService.getInstance()
      await service.signSafeTransaction(defaultParams)

      expect(mockGenerateTypedData).toHaveBeenCalledWith({
        safeAddress: '0xSafeAddress',
        safeVersion: '1.3.0',
        chainId: BigInt(1),
        data: mockTxParams,
      })
    })

    it('should sign typed data with Ledger', async () => {
      const service = LedgerSafeSigningService.getInstance()
      await service.signSafeTransaction(defaultParams)

      expect(mockSignTypedData).toHaveBeenCalledWith(mockSessionId, defaultParams.derivationPath, expect.any(Object))
    })

    it('should throw when no Ledger session', async () => {
      mockGetCurrentSession.mockReturnValue(null)

      const service = LedgerSafeSigningService.getInstance()

      await expect(service.signSafeTransaction(defaultParams)).rejects.toThrow('No active Ledger session found')
    })

    it('should throw when safeTx creation fails', async () => {
      mockCreateExistingTx.mockResolvedValue(null)

      const service = LedgerSafeSigningService.getInstance()

      await expect(service.signSafeTransaction(defaultParams)).rejects.toThrow('Safe transaction not found')
    })

    it('should throw on signing error', async () => {
      mockSignTypedData.mockRejectedValue(new Error('User rejected'))

      const service = LedgerSafeSigningService.getInstance()

      await expect(service.signSafeTransaction(defaultParams)).rejects.toThrow('Ledger signing failed: User rejected')
    })

    it('should log success info', async () => {
      const service = LedgerSafeSigningService.getInstance()
      await service.signSafeTransaction(defaultParams)

      expect(mockLoggerInfo).toHaveBeenCalledWith('Successfully signed transaction with Ledger', expect.any(Object))
    })

    it('should log error on failure', async () => {
      mockSignTypedData.mockRejectedValue(new Error('Failed'))

      const service = LedgerSafeSigningService.getInstance()

      await expect(service.signSafeTransaction(defaultParams)).rejects.toThrow()
      expect(mockLoggerError).toHaveBeenCalled()
    })
  })

  describe('isLedgerReady', () => {
    it('should return true when session exists', () => {
      const service = LedgerSafeSigningService.getInstance()

      expect(service.isLedgerReady()).toBe(true)
    })

    it('should return false when no session', () => {
      mockGetCurrentSession.mockReturnValue(null)

      const service = LedgerSafeSigningService.getInstance()

      expect(service.isLedgerReady()).toBe(false)
    })
  })

  describe('ensureLedgerConnection', () => {
    it('should not throw when connected', async () => {
      const service = LedgerSafeSigningService.getInstance()

      await expect(service.ensureLedgerConnection()).resolves.toBeUndefined()
    })

    it('should throw when not connected', async () => {
      mockGetCurrentSession.mockReturnValue(null)

      const service = LedgerSafeSigningService.getInstance()

      await expect(service.ensureLedgerConnection()).rejects.toThrow('Ledger device not connected')
    })
  })

  describe('convertToLedgerFormat', () => {
    it('should remove EIP712Domain from types', async () => {
      const service = LedgerSafeSigningService.getInstance()
      await service.signSafeTransaction(defaultParams)

      const signCall = mockSignTypedData.mock.calls[0]
      const ledgerTypedData = signCall[2]

      expect(ledgerTypedData.types).not.toHaveProperty('EIP712Domain')
      expect(ledgerTypedData.types).toHaveProperty('SafeTx')
    })

    it('should convert chainId to number', async () => {
      const service = LedgerSafeSigningService.getInstance()
      await service.signSafeTransaction(defaultParams)

      const signCall = mockSignTypedData.mock.calls[0]
      const ledgerTypedData = signCall[2]

      expect(typeof ledgerTypedData.domain.chainId).toBe('number')
    })
  })
})
