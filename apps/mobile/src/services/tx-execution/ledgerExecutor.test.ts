import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import type { Signer } from '@/src/store/signersSlice'
import type { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeInfo } from '@/src/types/address'
import { executeLedgerTx } from './ledgerExecutor'

// Mock dependencies
const mockGetState = jest.fn(() => ({}))
const mockSelectSignerByAddress = jest.fn()
const mockExecuteTransaction = jest.fn()
const mockGetUserNonce = jest.fn()
const mockDisconnect = jest.fn()

jest.mock('@/src/store', () => ({
  store: {
    getState: () => mockGetState(),
  },
}))

jest.mock('@/src/store/signersSlice', () => ({
  selectSignerByAddress: (...args: unknown[]) => mockSelectSignerByAddress(...args),
}))

jest.mock('@/src/services/ledger/ledger-execution.service', () => ({
  ledgerExecutionService: {
    executeTransaction: (...args: unknown[]) => mockExecuteTransaction(...args),
  },
}))

jest.mock('@/src/services/web3', () => ({
  getUserNonce: (...args: unknown[]) => mockGetUserNonce(...args),
}))

jest.mock('@/src/services/ledger/ledger-dmk.service', () => ({
  ledgerDMKService: {
    disconnect: (...args: unknown[]) => mockDisconnect(...args),
  },
}))

describe('executeLedgerTx', () => {
  const mockChain: Chain = {
    chainId: '1',
    chainName: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUriTemplate: {
      address: 'https://etherscan.io/address/{{address}}',
      txHash: 'https://etherscan.io/tx/{{txHash}}',
    },
  } as Chain

  const mockActiveSafe: SafeInfo = {
    address: '0xSafeAddress',
    chainId: '1',
  }

  const mockFeeParams: EstimatedFeeValues = {
    maxFeePerGas: BigInt('1000000000'),
    maxPriorityFeePerGas: BigInt('100000000'),
    gasLimit: BigInt('21000'),
    nonce: 5,
  }

  const mockLedgerSigner: Signer = {
    value: '0xLedgerAddress',
    name: 'Ledger Signer',
    type: 'ledger',
    derivationPath: "m/44'/60'/0'/0/0",
  }

  const defaultParams = {
    chain: mockChain,
    activeSafe: mockActiveSafe,
    txId: 'tx123',
    signerAddress: '0xLedgerAddress',
    feeParams: mockFeeParams,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUserNonce.mockResolvedValue(10)
    mockExecuteTransaction.mockResolvedValue({ hash: '0xTransactionHash' })
    mockDisconnect.mockResolvedValue(undefined)
  })

  describe('success cases', () => {
    it('should execute transaction successfully with Ledger signer', async () => {
      mockSelectSignerByAddress.mockReturnValue(mockLedgerSigner)

      const result = await executeLedgerTx(defaultParams)

      expect(mockSelectSignerByAddress).toHaveBeenCalledWith({}, '0xLedgerAddress')
      expect(mockGetState).toHaveBeenCalled()
      expect(mockExecuteTransaction).toHaveBeenCalledWith({
        chain: mockChain,
        activeSafe: mockActiveSafe,
        txId: 'tx123',
        signerAddress: '0xLedgerAddress',
        derivationPath: "m/44'/60'/0'/0/0",
        feeParams: mockFeeParams,
      })
      expect(mockGetUserNonce).toHaveBeenCalledWith(mockChain, '0xLedgerAddress')
      expect(mockDisconnect).toHaveBeenCalled()

      expect(result).toEqual({
        type: ExecutionMethod.WITH_PK,
        txId: 'tx123',
        chainId: '1',
        safeAddress: '0xSafeAddress',
        txHash: '0xTransactionHash',
        walletAddress: '0xLedgerAddress',
        walletNonce: 10,
      })
    })

    it('should handle null feeParams', async () => {
      mockSelectSignerByAddress.mockReturnValue(mockLedgerSigner)

      const result = await executeLedgerTx({
        ...defaultParams,
        feeParams: null,
      })

      expect(mockExecuteTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          feeParams: null,
        }),
      )
      expect(result).toBeDefined()
    })
  })

  describe('error cases', () => {
    it('should throw error when signer is not found', async () => {
      mockSelectSignerByAddress.mockReturnValue(undefined)

      await expect(executeLedgerTx(defaultParams)).rejects.toThrow('Signer not found')

      expect(mockExecuteTransaction).not.toHaveBeenCalled()
      expect(mockGetUserNonce).not.toHaveBeenCalled()
      expect(mockDisconnect).not.toHaveBeenCalled()
    })

    it('should throw error when signer type is not ledger', async () => {
      const privateKeySigner: Signer = {
        value: '0xLedgerAddress',
        name: 'Private Key Signer',
        type: 'private-key',
      }
      mockSelectSignerByAddress.mockReturnValue(privateKeySigner)

      await expect(executeLedgerTx(defaultParams)).rejects.toThrow('Expected Ledger signer but got different type')

      expect(mockExecuteTransaction).not.toHaveBeenCalled()
      expect(mockGetUserNonce).not.toHaveBeenCalled()
      expect(mockDisconnect).not.toHaveBeenCalled()
    })

    it('should throw error when derivation path is missing', async () => {
      const ledgerSignerWithoutPath = {
        value: '0xLedgerAddress',
        name: 'Ledger Signer',
        type: 'ledger' as const,
        // derivationPath is missing
      } as Signer
      mockSelectSignerByAddress.mockReturnValue(ledgerSignerWithoutPath)

      await expect(executeLedgerTx(defaultParams)).rejects.toThrow('Ledger signer missing derivation path')

      expect(mockExecuteTransaction).not.toHaveBeenCalled()
      expect(mockGetUserNonce).not.toHaveBeenCalled()
      expect(mockDisconnect).not.toHaveBeenCalled()
    })

    it('should propagate error from executeTransaction', async () => {
      mockSelectSignerByAddress.mockReturnValue(mockLedgerSigner)
      const executionError = new Error('Ledger execution failed')
      mockExecuteTransaction.mockRejectedValue(executionError)

      await expect(executeLedgerTx(defaultParams)).rejects.toThrow('Ledger execution failed')

      expect(mockGetUserNonce).not.toHaveBeenCalled()
      expect(mockDisconnect).not.toHaveBeenCalled()
    })

    it('should propagate error from getUserNonce', async () => {
      mockSelectSignerByAddress.mockReturnValue(mockLedgerSigner)
      const nonceError = new Error('Failed to get nonce')
      mockGetUserNonce.mockRejectedValue(nonceError)

      await expect(executeLedgerTx(defaultParams)).rejects.toThrow('Failed to get nonce')

      expect(mockExecuteTransaction).toHaveBeenCalled()
      expect(mockDisconnect).not.toHaveBeenCalled()
    })

    it('should propagate error from disconnect', async () => {
      mockSelectSignerByAddress.mockReturnValue(mockLedgerSigner)
      const disconnectError = new Error('Failed to disconnect')
      mockDisconnect.mockRejectedValue(disconnectError)

      await expect(executeLedgerTx(defaultParams)).rejects.toThrow('Failed to disconnect')

      expect(mockExecuteTransaction).toHaveBeenCalled()
      expect(mockGetUserNonce).toHaveBeenCalled()
    })
  })

  describe('execution flow', () => {
    it('should call services in correct order', async () => {
      mockSelectSignerByAddress.mockReturnValue(mockLedgerSigner)

      const callOrder: string[] = []
      mockSelectSignerByAddress.mockImplementation(() => {
        callOrder.push('selectSignerByAddress')
        return mockLedgerSigner
      })
      mockExecuteTransaction.mockImplementation(async () => {
        callOrder.push('executeTransaction')
        return { hash: '0xHash' }
      })
      mockGetUserNonce.mockImplementation(async () => {
        callOrder.push('getUserNonce')
        return 10
      })
      mockDisconnect.mockImplementation(async () => {
        callOrder.push('disconnect')
      })

      await executeLedgerTx(defaultParams)

      expect(callOrder).toEqual(['selectSignerByAddress', 'executeTransaction', 'getUserNonce', 'disconnect'])
    })
  })
})
