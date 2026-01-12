import type { DeviceSessionId } from '@ledgerhq/device-management-kit'
import type { TypedData } from '@ledgerhq/device-signer-kit-ethereum'
import { LedgerEthereumService } from './ledger-ethereum.service'

const mockSignerBuild = jest.fn()
const mockGetAddress = jest.fn()
const mockSignTransaction = jest.fn()
const mockSignTypedData = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('@ledgerhq/device-signer-kit-ethereum', () => ({
  SignerEthBuilder: jest.fn().mockImplementation(() => ({
    build: () => mockSignerBuild(),
  })),
}))

jest.mock('ethers', () => ({
  getAccountPath: (index: number) => `m/44'/60'/${index}'/0/0`,
}))

jest.mock('./ledger-dmk.service', () => ({
  ledgerDMKService: {
    dmk: {},
  },
}))

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}))

describe('LedgerEthereumService', () => {
  const mockSessionId = 'session-123' as DeviceSessionId
  const mockDerivationPath = "44'/60'/0'/0/0"

  beforeEach(() => {
    jest.clearAllMocks()

    mockSignerBuild.mockReturnValue({
      getAddress: mockGetAddress,
      signTransaction: mockSignTransaction,
      signTypedData: mockSignTypedData,
    })
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LedgerEthereumService.getInstance()
      const instance2 = LedgerEthereumService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe('getEthereumAddresses', () => {
    it('should return addresses from Ledger device', async () => {
      const mockAddress = { address: '0x1234567890123456789012345678901234567890' }
      mockGetAddress.mockReturnValue({
        observable: {
          subscribe: ({ next }: { next: (state: unknown) => void }) => {
            next({ status: 'completed', output: mockAddress })
          },
        },
      })

      const service = LedgerEthereumService.getInstance()
      const addresses = await service.getEthereumAddresses(mockSessionId, 1, 0)

      expect(addresses).toHaveLength(1)
      expect(addresses[0].address).toBe(mockAddress.address)
      expect(addresses[0].index).toBe(0)
    })

    it('should return multiple addresses', async () => {
      let callIndex = 0
      mockGetAddress.mockImplementation(() => ({
        observable: {
          subscribe: ({ next }: { next: (state: unknown) => void }) => {
            next({
              status: 'completed',
              output: { address: `0x${callIndex++}000000000000000000000000000000000000000` },
            })
          },
        },
      }))

      const service = LedgerEthereumService.getInstance()
      const addresses = await service.getEthereumAddresses(mockSessionId, 3, 0)

      expect(addresses).toHaveLength(3)
      expect(addresses[0].index).toBe(0)
      expect(addresses[1].index).toBe(1)
      expect(addresses[2].index).toBe(2)
    })

    it('should use legacy derivation path when specified', async () => {
      mockGetAddress.mockReturnValue({
        observable: {
          subscribe: ({ next }: { next: (state: unknown) => void }) => {
            next({ status: 'completed', output: { address: '0x123' } })
          },
        },
      })

      const service = LedgerEthereumService.getInstance()
      await service.getEthereumAddresses(mockSessionId, 1, 0, 'legacy-ledger')

      expect(mockGetAddress).toHaveBeenCalledWith("44'/60'/0'/0")
    })

    it('should continue on address fetch error', async () => {
      let callCount = 0
      mockGetAddress.mockImplementation(() => ({
        observable: {
          subscribe: ({ next, error }: { next: (state: unknown) => void; error: (e: Error) => void }) => {
            callCount++
            if (callCount === 2) {
              error(new Error('Device error'))
            } else {
              next({ status: 'completed', output: { address: `0x${callCount}` } })
            }
          },
        },
      }))

      const service = LedgerEthereumService.getInstance()
      const addresses = await service.getEthereumAddresses(mockSessionId, 3, 0)

      expect(addresses).toHaveLength(2)
      expect(mockLoggerError).toHaveBeenCalled()
    })

    it('should handle device action error state', async () => {
      mockGetAddress.mockReturnValue({
        observable: {
          subscribe: ({ next }: { next: (state: unknown) => void }) => {
            next({ status: 'error', error: new Error('Device rejected') })
          },
        },
      })

      const service = LedgerEthereumService.getInstance()
      const addresses = await service.getEthereumAddresses(mockSessionId, 1, 0)

      expect(addresses).toHaveLength(0)
    })
  })

  describe('getEthereumAddress', () => {
    it('should return single address by index', async () => {
      const mockAddress = { address: '0xSingleAddress' }
      mockGetAddress.mockReturnValue({
        observable: {
          subscribe: ({ next }: { next: (state: unknown) => void }) => {
            next({ status: 'completed', output: mockAddress })
          },
        },
      })

      const service = LedgerEthereumService.getInstance()
      const address = await service.getEthereumAddress(mockSessionId, 5)

      expect(address.address).toBe(mockAddress.address)
      expect(address.index).toBe(5)
    })

    it('should throw when address retrieval fails', async () => {
      mockGetAddress.mockReturnValue({
        observable: {
          subscribe: ({ next }: { next: (state: unknown) => void }) => {
            next({ status: 'error', error: new Error('Failed') })
          },
        },
      })

      const service = LedgerEthereumService.getInstance()

      await expect(service.getEthereumAddress(mockSessionId, 0)).rejects.toThrow(
        'Failed to retrieve address at index 0',
      )
    })
  })

  describe('signTransaction', () => {
    it('should sign transaction and return formatted signature', async () => {
      const mockSignature = {
        r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        s: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
        v: 27,
      }
      mockSignTransaction.mockReturnValue({
        observable: {
          subscribe: ({ next }: { next: (state: unknown) => void }) => {
            next({ status: 'completed', output: mockSignature })
          },
        },
      })

      const service = LedgerEthereumService.getInstance()
      const txBuffer = new Uint8Array([1, 2, 3])
      const signature = await service.signTransaction(mockSessionId, mockDerivationPath, txBuffer)

      expect(signature).toMatch(/^0x[a-fA-F0-9]+$/)
      expect(mockSignTransaction).toHaveBeenCalledWith(mockDerivationPath, txBuffer)
    })

    it('should throw error when signing fails', async () => {
      mockSignTransaction.mockReturnValue({
        observable: {
          subscribe: ({ error }: { error: (e: Error) => void }) => {
            error(new Error('User rejected'))
          },
        },
      })

      const service = LedgerEthereumService.getInstance()
      const txBuffer = new Uint8Array([1, 2, 3])

      await expect(service.signTransaction(mockSessionId, mockDerivationPath, txBuffer)).rejects.toThrow(
        'Failed to sign transaction: User rejected',
      )
    })
  })

  describe('signTypedData', () => {
    const mockTypedData: TypedData = {
      domain: { verifyingContract: '0xSafe', chainId: 1 },
      types: { SafeTx: [{ name: 'to', type: 'address' }] },
      primaryType: 'SafeTx',
      message: { to: '0xRecipient' },
    }

    it('should sign typed data and return formatted signature', async () => {
      const mockSignature = {
        r: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        s: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        v: 28,
      }
      mockSignTypedData.mockReturnValue({
        observable: {
          subscribe: ({ next }: { next: (state: unknown) => void }) => {
            next({ status: 'completed', output: mockSignature })
          },
        },
      })

      const service = LedgerEthereumService.getInstance()
      const signature = await service.signTypedData(mockSessionId, mockDerivationPath, mockTypedData)

      expect(signature).toMatch(/^0x[a-fA-F0-9]+$/)
      expect(mockSignTypedData).toHaveBeenCalledWith(mockDerivationPath, mockTypedData)
    })

    it('should throw error when signing typed data fails', async () => {
      mockSignTypedData.mockReturnValue({
        observable: {
          subscribe: ({ error }: { error: (e: Error) => void }) => {
            error(new Error('Signing rejected'))
          },
        },
      })

      const service = LedgerEthereumService.getInstance()

      await expect(service.signTypedData(mockSessionId, mockDerivationPath, mockTypedData)).rejects.toThrow(
        'Failed to sign typed data: Signing rejected',
      )
    })
  })
})
