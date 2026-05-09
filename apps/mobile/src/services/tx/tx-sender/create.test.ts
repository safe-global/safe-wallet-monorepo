import { faker } from '@faker-js/faker'
import { createTx, addSignaturesToTx, createExistingTx, proposeTx } from './create'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { createConnectedWallet } from '@/src/services/web3'
import { fetchTransactionDetails } from '@/src/services/tx/fetchTransactionDetails'
import extractTxInfo from '@/src/services/tx/extractTx'
import type { SafeTransactionDataPartial } from '@safe-global/types-kit'
import type { SafeInfo } from '@/src/types/address'
import {
  generateChecksummedAddress,
  createMockSafeTx,
  createMockChain,
  createMockSafeInfo,
  createMockProtocolKit,
} from '@safe-global/test'

jest.mock('@/src/hooks/coreSDK/safeCoreSDK')
jest.mock('@/src/services/web3')
jest.mock('@/src/services/tx/fetchTransactionDetails')
jest.mock('@/src/services/tx/extractTx')

describe('create.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTx', () => {
    const mockSafeSDK = {
      createTransaction: jest.fn(),
    }

    beforeEach(() => {
      ;(getSafeSDK as jest.Mock).mockReturnValue(mockSafeSDK)
    })

    it('creates a transaction using safe SDK', async () => {
      const txParams: SafeTransactionDataPartial = {
        to: generateChecksummedAddress(),
        value: '1000000000000000000',
        data: '0x',
      }
      const mockTx = createMockSafeTx()
      mockSafeSDK.createTransaction.mockResolvedValue(mockTx)

      const result = await createTx(txParams)

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledWith({
        transactions: [txParams],
      })
      expect(result).toBe(mockTx)
    })

    it('includes nonce when provided', async () => {
      const txParams: SafeTransactionDataPartial = {
        to: generateChecksummedAddress(),
        value: '0',
        data: '0x',
      }
      const nonce = 42
      const mockTx = createMockSafeTx()
      mockSafeSDK.createTransaction.mockResolvedValue(mockTx)

      await createTx(txParams, nonce)

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledWith({
        transactions: [{ ...txParams, nonce }],
      })
    })

    it('throws error when SDK is not initialized', async () => {
      ;(getSafeSDK as jest.Mock).mockReturnValue(null)
      const txParams: SafeTransactionDataPartial = {
        to: generateChecksummedAddress(),
        value: '0',
        data: '0x',
      }

      await expect(createTx(txParams)).rejects.toThrow(
        'The Safe SDK could not be initialized. Please be aware that we only support v1.0.0 Safe Accounts and up.',
      )
    })

    it('converts NaN safeTxGas to "0"', async () => {
      const txParams: SafeTransactionDataPartial = {
        to: generateChecksummedAddress(),
        value: '0',
        data: '0x',
        safeTxGas: Number.NaN as unknown as string,
      }
      const mockTx = createMockSafeTx()
      mockSafeSDK.createTransaction.mockResolvedValue(mockTx)

      await createTx(txParams)

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledWith({
        transactions: [{ ...txParams, safeTxGas: '0' }],
      })
    })

    it('converts "NaN" string safeTxGas to "0"', async () => {
      const txParams: SafeTransactionDataPartial = {
        to: generateChecksummedAddress(),
        value: '0',
        data: '0x',
        safeTxGas: 'NaN',
      }
      const mockTx = createMockSafeTx()
      mockSafeSDK.createTransaction.mockResolvedValue(mockTx)

      await createTx(txParams)

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledWith({
        transactions: [{ ...txParams, safeTxGas: '0' }],
      })
    })

    it('preserves valid safeTxGas number value', async () => {
      const txParams: SafeTransactionDataPartial = {
        to: generateChecksummedAddress(),
        value: '0',
        data: '0x',
        safeTxGas: '50000',
      }
      const mockTx = createMockSafeTx()
      mockSafeSDK.createTransaction.mockResolvedValue(mockTx)

      await createTx(txParams)

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledWith({
        transactions: [txParams],
      })
    })

    it('preserves undefined safeTxGas', async () => {
      const txParams: SafeTransactionDataPartial = {
        to: generateChecksummedAddress(),
        value: '0',
        data: '0x',
      }
      const mockTx = createMockSafeTx()
      mockSafeSDK.createTransaction.mockResolvedValue(mockTx)

      await createTx(txParams)

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledWith({
        transactions: [txParams],
      })
    })

    it('handles NaN safeTxGas with nonce', async () => {
      const txParams: SafeTransactionDataPartial = {
        to: generateChecksummedAddress(),
        value: '0',
        data: '0x',
        safeTxGas: Number.NaN as unknown as string,
      }
      const nonce = 42
      const mockTx = createMockSafeTx()
      mockSafeSDK.createTransaction.mockResolvedValue(mockTx)

      await createTx(txParams, nonce)

      expect(mockSafeSDK.createTransaction).toHaveBeenCalledWith({
        transactions: [{ ...txParams, nonce, safeTxGas: '0' }],
      })
    })
  })

  describe('addSignaturesToTx', () => {
    it('adds signatures to transaction', () => {
      const mockTx = createMockSafeTx()
      const signer1 = generateChecksummedAddress()
      const signer2 = generateChecksummedAddress()
      const signatures = {
        [signer1]: '0xsignature1',
        [signer2]: '0xsignature2',
      }

      addSignaturesToTx(mockTx, signatures)

      expect(mockTx.addSignature).toHaveBeenCalledTimes(2)
      expect(mockTx.addSignature).toHaveBeenCalledWith(
        expect.objectContaining({
          signer: signer1,
          data: '0xsignature1',
          isContractSignature: false,
        }),
      )
      expect(mockTx.addSignature).toHaveBeenCalledWith(
        expect.objectContaining({
          signer: signer2,
          data: '0xsignature2',
          isContractSignature: false,
        }),
      )
    })

    it('handles empty signatures', () => {
      const mockTx = createMockSafeTx()

      addSignaturesToTx(mockTx, {})

      expect(mockTx.addSignature).not.toHaveBeenCalled()
    })
  })

  describe('createExistingTx', () => {
    const mockSafeSDK = {
      createTransaction: jest.fn(),
    }

    beforeEach(() => {
      ;(getSafeSDK as jest.Mock).mockReturnValue(mockSafeSDK)
    })

    it('creates transaction and adds signatures', async () => {
      const txParams: SafeTransactionDataPartial = {
        to: generateChecksummedAddress(),
        value: '0',
        data: '0x',
        nonce: 5,
      }
      const signer = generateChecksummedAddress()
      const signatures = { [signer]: '0xsignature' }
      const mockTx = createMockSafeTx()
      mockSafeSDK.createTransaction.mockResolvedValue(mockTx)

      const result = await createExistingTx(txParams, signatures)

      expect(mockSafeSDK.createTransaction).toHaveBeenCalled()
      expect(mockTx.addSignature).toHaveBeenCalledWith(
        expect.objectContaining({
          signer,
          data: '0xsignature',
        }),
      )
      expect(result).toBe(mockTx)
    })
  })

  describe('proposeTx', () => {
    const mockChain = createMockChain()
    const mockActiveSafe: SafeInfo = createMockSafeInfo()
    const mockPrivateKey = faker.string.hexadecimal({ length: 64, prefix: '0x' })
    const mockTxId = faker.string.uuid()

    const mockProtocolKit = createMockProtocolKit()

    beforeEach(() => {
      ;(createConnectedWallet as jest.Mock).mockResolvedValue({
        wallet: { address: generateChecksummedAddress() },
        protocolKit: mockProtocolKit,
      })
    })

    it('fetches transaction details when not provided', async () => {
      const mockTxDetails = { txId: mockTxId }
      const mockTxParams = { to: generateChecksummedAddress(), value: '0', data: '0x' }
      const mockSignatures = {}
      const mockTx = createMockSafeTx()

      ;(fetchTransactionDetails as jest.Mock).mockResolvedValue(mockTxDetails)
      ;(extractTxInfo as jest.Mock).mockReturnValue({ txParams: mockTxParams, signatures: mockSignatures })
      mockProtocolKit.createTransaction.mockResolvedValue(mockTx)

      await proposeTx({
        activeSafe: mockActiveSafe,
        txId: mockTxId,
        privateKey: mockPrivateKey,
        chain: mockChain,
      })

      expect(fetchTransactionDetails).toHaveBeenCalledWith(mockActiveSafe.chainId, mockTxId)
      expect(extractTxInfo).toHaveBeenCalledWith(mockTxDetails, mockActiveSafe.address)
    })

    it('uses provided transaction details', async () => {
      const mockTxDetails = { txId: mockTxId }
      const mockTxParams = { to: generateChecksummedAddress(), value: '0', data: '0x' }
      const mockSignatures = {}
      const mockTx = createMockSafeTx()

      ;(extractTxInfo as jest.Mock).mockReturnValue({ txParams: mockTxParams, signatures: mockSignatures })
      mockProtocolKit.createTransaction.mockResolvedValue(mockTx)

      await proposeTx({
        activeSafe: mockActiveSafe,
        txId: mockTxId,
        privateKey: mockPrivateKey,
        txDetails: mockTxDetails as never,
        chain: mockChain,
      })

      expect(fetchTransactionDetails).not.toHaveBeenCalled()
      expect(extractTxInfo).toHaveBeenCalledWith(mockTxDetails, mockActiveSafe.address)
    })

    it('returns safeTx and signatures', async () => {
      const mockTxDetails = { txId: mockTxId }
      const mockTxParams = { to: generateChecksummedAddress(), value: '0', data: '0x' }
      const signer = generateChecksummedAddress()
      const mockSignatures = { [signer]: '0xsig' }
      const mockTx = createMockSafeTx()

      ;(fetchTransactionDetails as jest.Mock).mockResolvedValue(mockTxDetails)
      ;(extractTxInfo as jest.Mock).mockReturnValue({ txParams: mockTxParams, signatures: mockSignatures })
      mockProtocolKit.createTransaction.mockResolvedValue(mockTx)

      const result = await proposeTx({
        activeSafe: mockActiveSafe,
        txId: mockTxId,
        privateKey: mockPrivateKey,
        chain: mockChain,
      })

      expect(result).toEqual({ safeTx: mockTx, signatures: mockSignatures })
    })

    it('creates connected wallet with correct params', async () => {
      const mockTxDetails = { txId: mockTxId }
      const mockTxParams = { to: generateChecksummedAddress(), value: '0', data: '0x' }
      const mockTx = createMockSafeTx()

      ;(fetchTransactionDetails as jest.Mock).mockResolvedValue(mockTxDetails)
      ;(extractTxInfo as jest.Mock).mockReturnValue({ txParams: mockTxParams, signatures: {} })
      mockProtocolKit.createTransaction.mockResolvedValue(mockTx)

      await proposeTx({
        activeSafe: mockActiveSafe,
        txId: mockTxId,
        privateKey: mockPrivateKey,
        chain: mockChain,
      })

      expect(createConnectedWallet).toHaveBeenCalledWith(mockPrivateKey, mockActiveSafe, mockChain)
    })
  })
})
