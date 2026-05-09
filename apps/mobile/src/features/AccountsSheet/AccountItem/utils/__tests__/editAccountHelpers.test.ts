import {
  isOwnerInOtherSafes,
  getSafeOwnersWithPrivateKeys,
  getOwnersToDelete,
  createDeletionMessage,
  cleanupSinglePrivateKey,
  cleanupPrivateKeysForOwners,
  categorizeOwnersToDelete,
  cleanupLedgerSigners,
  CategorizedOwners,
} from '../editAccountHelpers'
import { ErrorType } from '@/src/utils/errors'
import { Address } from '@/src/types/address'
import { AppDispatch } from '@/src/store'
import { keyStorageService } from '@/src/services/key-storage'
import { removeSigner } from '@/src/store/signersSlice'
import Logger from '@/src/utils/logger'

jest.mock('@/src/services/key-storage', () => ({
  keyStorageService: {
    getPrivateKey: jest.fn(),
    removePrivateKey: jest.fn(),
  },
}))

jest.mock('@/src/store/signersSlice', () => ({
  removeSigner: jest.fn(),
}))

jest.mock('@/src/utils/logger', () => ({
  error: jest.fn(),
}))

describe('editAccountHelpers', () => {
  const mockAddress1 = '0x1234567890123456789012345678901234567890' as Address
  const mockAddress2 = '0x9876543210987654321098765432109876543210' as Address
  const mockAddress3 = '0x1111111111111111111111111111111111111111' as Address
  const mockSafeAddress1 = '0x5555555555555555555555555555555555555555' as Address
  const mockSafeAddress2 = '0x6666666666666666666666666666666666666666' as Address

  const mockSafesInfo = {
    [mockSafeAddress1]: {
      deployment1: {
        address: { value: mockSafeAddress1 },
        chainId: 'deployment1',
        threshold: 1,
        owners: [{ value: mockAddress1 }, { value: mockAddress2 }],
        fiatTotal: '0',
        queued: 0,
      },
    },
    [mockSafeAddress2]: {
      deployment1: {
        address: { value: mockSafeAddress2 },
        chainId: 'deployment1',
        threshold: 1,
        owners: [{ value: mockAddress2 }, { value: mockAddress3 }],
        fiatTotal: '0',
        queued: 0,
      },
    },
  }

  const mockSigners = {
    [mockAddress1]: {
      value: mockAddress1,
      name: 'Signer 1',
      type: 'private-key' as const,
    },
    [mockAddress2]: {
      value: mockAddress2,
      name: 'Signer 2',
      type: 'private-key' as const,
    },
    [mockAddress3]: {
      value: mockAddress3,
      name: 'Ledger Signer',
      type: 'ledger' as const,
      derivationPath: "m/44'/60'/0'/0/0",
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isOwnerInOtherSafes', () => {
    it('should return true when owner is in other safes', () => {
      const result = isOwnerInOtherSafes(mockAddress2, mockSafeAddress1, mockSafesInfo)
      expect(result).toBe(true)
    })

    it('should return false when owner is not in other safes', () => {
      const result = isOwnerInOtherSafes(mockAddress1, mockSafeAddress1, mockSafesInfo)
      expect(result).toBe(false)
    })

    it('should exclude the specified safe address', () => {
      const result = isOwnerInOtherSafes(mockAddress3, mockSafeAddress2, mockSafesInfo)
      expect(result).toBe(false)
    })
  })

  describe('getSafeOwnersWithPrivateKeys', () => {
    it('should return owners that have private keys stored', () => {
      const result = getSafeOwnersWithPrivateKeys(mockSafeAddress1, mockSafesInfo, mockSigners)
      expect(result).toEqual([mockAddress1, mockAddress2])
    })

    it('should return empty array for safe with no private keys', () => {
      const mockAddress4 = '0x4444444444444444444444444444444444444444' as Address
      const safeWithNoPrivateKeys = {
        [mockSafeAddress1]: {
          deployment1: {
            address: { value: mockSafeAddress1 },
            chainId: 'deployment1',
            threshold: 1,
            owners: [{ value: mockAddress4 }], // Address not in signers collection
            fiatTotal: '0',
            queued: 0,
          },
        },
      }
      const result = getSafeOwnersWithPrivateKeys(mockSafeAddress1, safeWithNoPrivateKeys, mockSigners)
      expect(result).toEqual([])
    })

    it('should return empty array for non-existent safe', () => {
      const result = getSafeOwnersWithPrivateKeys(
        '0x999999999999999999999999999999999999999' as Address,
        mockSafesInfo,
        mockSigners,
      )
      expect(result).toEqual([])
    })
  })

  describe('getOwnersToDelete', () => {
    it('should return owners that can be safely deleted', () => {
      const result = getOwnersToDelete(mockSafeAddress1, mockSafesInfo, mockSigners)
      expect(result).toEqual([mockAddress1]) // mockAddress2 is used in other safes
    })

    it('should return owners that are not used in other safes', () => {
      const result = getOwnersToDelete(mockSafeAddress2, mockSafesInfo, mockSigners)
      expect(result).toEqual([mockAddress3]) // mockAddress2 is used in other safes, but mockAddress3 (ledger) can be deleted
    })
  })

  describe('createDeletionMessage', () => {
    it('should create message for private key deletion only', () => {
      const categorizedOwners: CategorizedOwners = {
        privateKeyOwners: [mockAddress1, mockAddress2],
        ledgerOwners: [],
      }

      const result = createDeletionMessage(categorizedOwners)

      expect(result).toContain('signers that will be affected')
      expect(result).toContain('2 private key(s) will be deleted')
      expect(result).not.toContain('Ledger signer(s)')
      expect(result).toContain('cannot be undone')
    })

    it('should create message for ledger deletion only', () => {
      const categorizedOwners: CategorizedOwners = {
        privateKeyOwners: [],
        ledgerOwners: [mockAddress3],
      }

      const result = createDeletionMessage(categorizedOwners)

      expect(result).toContain('signers that will be affected')
      expect(result).toContain('1 Ledger signer(s) will be removed')
      expect(result).not.toContain('private key(s)')
      expect(result).toContain('cannot be undone')
    })

    it('should create message for mixed deletion', () => {
      const categorizedOwners: CategorizedOwners = {
        privateKeyOwners: [mockAddress1],
        ledgerOwners: [mockAddress3],
      }

      const result = createDeletionMessage(categorizedOwners)

      expect(result).toContain('signers that will be affected')
      expect(result).toContain('1 private key(s) will be deleted')
      expect(result).toContain('1 Ledger signer(s) will be removed')
      expect(result).toContain('cannot be undone')
    })

    it('should create message for no signers', () => {
      const categorizedOwners: CategorizedOwners = {
        privateKeyOwners: [],
        ledgerOwners: [],
      }

      const result = createDeletionMessage(categorizedOwners)

      expect(result).toBe('This account will be deleted. This action cannot be undone.')
    })
  })

  describe('cleanupSinglePrivateKey', () => {
    it('should successfully cleanup a single private key', async () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockRemoveAllDelegatesForOwner = jest.fn().mockResolvedValue({ success: true })

      ;(keyStorageService.getPrivateKey as jest.Mock).mockResolvedValue('private-key-data')
      ;(keyStorageService.removePrivateKey as jest.Mock).mockResolvedValue(undefined)

      const result = await cleanupSinglePrivateKey(mockAddress1, mockRemoveAllDelegatesForOwner, mockDispatch)

      expect(result.success).toBe(true)
      expect(mockRemoveAllDelegatesForOwner).toHaveBeenCalledWith(mockAddress1, 'private-key-data')
      expect(keyStorageService.removePrivateKey).toHaveBeenCalledWith(mockAddress1)
      expect(mockDispatch).toHaveBeenCalledWith(removeSigner(mockAddress1))
    })

    it('should handle missing private key', async () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockRemoveAllDelegatesForOwner = jest.fn()

      ;(keyStorageService.getPrivateKey as jest.Mock).mockResolvedValue(null)

      const result = await cleanupSinglePrivateKey(mockAddress1, mockRemoveAllDelegatesForOwner, mockDispatch)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.STORAGE_ERROR)
      expect(result.error?.message).toBe('Private key not found for the specified address')
      expect(mockRemoveAllDelegatesForOwner).not.toHaveBeenCalled()
      expect(keyStorageService.removePrivateKey).not.toHaveBeenCalled()
      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should handle delegate removal failure', async () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockRemoveAllDelegatesForOwner = jest.fn().mockResolvedValue({
        success: false,
        error: {
          message: 'Failed to remove delegates',
          type: 'BACKEND_REMOVAL_FAILED',
        },
      })

      ;(keyStorageService.getPrivateKey as jest.Mock).mockResolvedValue('private-key-data')

      const result = await cleanupSinglePrivateKey(mockAddress1, mockRemoveAllDelegatesForOwner, mockDispatch)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.CLEANUP_ERROR)
      expect(result.error?.message).toBe('Failed to remove delegates')
      expect(keyStorageService.removePrivateKey).not.toHaveBeenCalled()
      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should handle keychain errors', async () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockRemoveAllDelegatesForOwner = jest.fn()

      ;(keyStorageService.getPrivateKey as jest.Mock).mockRejectedValue(new Error('Keychain error'))

      const result = await cleanupSinglePrivateKey(mockAddress1, mockRemoveAllDelegatesForOwner, mockDispatch)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.SYSTEM_ERROR)
      expect(result.error?.message).toBe('An unexpected error occurred during private key cleanup')
      expect(mockRemoveAllDelegatesForOwner).not.toHaveBeenCalled()
      expect(keyStorageService.removePrivateKey).not.toHaveBeenCalled()
      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })

  describe('cleanupPrivateKeysForOwners', () => {
    it('should successfully cleanup private keys for owners', async () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockRemoveAllDelegatesForOwner = jest.fn().mockResolvedValue({ success: true })

      ;(keyStorageService.getPrivateKey as jest.Mock).mockResolvedValue('private-key-data')
      ;(keyStorageService.removePrivateKey as jest.Mock).mockResolvedValue(undefined)

      await cleanupPrivateKeysForOwners([mockAddress1, mockAddress2], mockRemoveAllDelegatesForOwner, mockDispatch)

      expect(mockRemoveAllDelegatesForOwner).toHaveBeenCalledTimes(2)
      expect(keyStorageService.removePrivateKey).toHaveBeenCalledTimes(2)
      expect(mockDispatch).toHaveBeenCalledTimes(2)
      expect(mockDispatch).toHaveBeenCalledWith(removeSigner(mockAddress1))
      expect(mockDispatch).toHaveBeenCalledWith(removeSigner(mockAddress2))
    })

    it('should handle delegate removal failure gracefully', async () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockRemoveAllDelegatesForOwner = jest.fn().mockResolvedValue({
        success: false,
        error: {
          message: 'Failed to remove delegates',
          type: 'BACKEND_REMOVAL_FAILED',
        },
      })

      ;(keyStorageService.getPrivateKey as jest.Mock).mockResolvedValue('private-key-data')

      await cleanupPrivateKeysForOwners([mockAddress1], mockRemoveAllDelegatesForOwner, mockDispatch)

      expect(Logger.error).toHaveBeenCalledWith(
        `Failed to cleanup private key for ${mockAddress1}:`,
        expect.objectContaining({
          message: 'Failed to remove delegates',
          type: 'CLEANUP_ERROR',
        }),
      )
      expect(keyStorageService.removePrivateKey).not.toHaveBeenCalled()
      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should handle missing private key gracefully', async () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockRemoveAllDelegatesForOwner = jest.fn()

      ;(keyStorageService.getPrivateKey as jest.Mock).mockResolvedValue(null)

      await cleanupPrivateKeysForOwners([mockAddress1], mockRemoveAllDelegatesForOwner, mockDispatch)

      expect(mockRemoveAllDelegatesForOwner).not.toHaveBeenCalled()
      expect(keyStorageService.removePrivateKey).not.toHaveBeenCalled()
      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should handle keychain errors gracefully', async () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockRemoveAllDelegatesForOwner = jest.fn()

      ;(keyStorageService.getPrivateKey as jest.Mock).mockRejectedValue(new Error('Keychain error'))

      await cleanupPrivateKeysForOwners([mockAddress1], mockRemoveAllDelegatesForOwner, mockDispatch)

      expect(Logger.error).toHaveBeenCalledWith(
        `Failed to cleanup private key for ${mockAddress1}:`,
        expect.objectContaining({
          message: 'An unexpected error occurred during private key cleanup',
          type: 'SYSTEM_ERROR',
        }),
      )
      expect(mockRemoveAllDelegatesForOwner).not.toHaveBeenCalled()
      expect(keyStorageService.removePrivateKey).not.toHaveBeenCalled()
      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should handle mixed success and failure scenarios', async () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockRemoveAllDelegatesForOwner = jest
        .fn()
        .mockResolvedValueOnce({ success: true }) // First call succeeds
        .mockResolvedValueOnce({ success: false, error: { message: 'Network error' } }) // Second call fails

      ;(keyStorageService.getPrivateKey as jest.Mock).mockResolvedValue('private-key-data')
      ;(keyStorageService.removePrivateKey as jest.Mock).mockResolvedValue(undefined)

      const result = await cleanupPrivateKeysForOwners(
        [mockAddress1, mockAddress2],
        mockRemoveAllDelegatesForOwner,
        mockDispatch,
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Failed to clean up 1 out of 2 private keys')
      expect(result.error?.details?.processedCount).toBe(1)
      expect(result.error?.details?.failures).toHaveLength(1)
      expect((result.error?.details?.failures as { address: string; error: unknown }[])?.[0]?.address).toBe(
        mockAddress2,
      )
      expect(mockRemoveAllDelegatesForOwner).toHaveBeenCalledTimes(2)
      expect(keyStorageService.removePrivateKey).toHaveBeenCalledTimes(1) // Only successful one
      expect(mockDispatch).toHaveBeenCalledTimes(1) // Only successful one
    })

    it('should handle empty owner list', async () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockRemoveAllDelegatesForOwner = jest.fn()

      const result = await cleanupPrivateKeysForOwners([], mockRemoveAllDelegatesForOwner, mockDispatch)

      expect(result.success).toBe(true)
      expect(result.data?.processedCount).toBe(0)
      expect(result.data?.failures).toHaveLength(0)
      expect(mockRemoveAllDelegatesForOwner).not.toHaveBeenCalled()
      expect(keyStorageService.getPrivateKey).not.toHaveBeenCalled()
      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should handle all cleanup failures', async () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockRemoveAllDelegatesForOwner = jest.fn().mockResolvedValue({
        success: false,
        error: { message: 'All delegates failed' },
      })

      ;(keyStorageService.getPrivateKey as jest.Mock).mockResolvedValue('private-key-data')

      const result = await cleanupPrivateKeysForOwners(
        [mockAddress1, mockAddress2],
        mockRemoveAllDelegatesForOwner,
        mockDispatch,
      )

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Failed to clean up 2 out of 2 private keys')
      expect(result.error?.details?.processedCount).toBe(0)
      expect(result.error?.details?.failures).toHaveLength(2)
      expect(keyStorageService.removePrivateKey).not.toHaveBeenCalled()
      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })

  describe('categorizeOwnersToDelete', () => {
    it('should categorize owners into private key and ledger signers', () => {
      const result = categorizeOwnersToDelete(mockSafeAddress1, mockSafesInfo, mockSigners)

      expect(result.privateKeyOwners).toEqual([mockAddress1]) // mockAddress2 is used in other safes
      expect(result.ledgerOwners).toEqual([])
    })

    it('should handle safe with ledger signers', () => {
      const safeWithLedger = {
        [mockSafeAddress1]: {
          deployment1: {
            address: { value: mockSafeAddress1 },
            chainId: 'deployment1',
            threshold: 1,
            owners: [{ value: mockAddress3 }], // Ledger signer
            fiatTotal: '0',
            queued: 0,
          },
        },
      }

      const result = categorizeOwnersToDelete(mockSafeAddress1, safeWithLedger, mockSigners)

      expect(result.privateKeyOwners).toEqual([])
      expect(result.ledgerOwners).toEqual([mockAddress3])
    })

    it('should handle mixed signers', () => {
      const safeWithMixed = {
        [mockSafeAddress1]: {
          deployment1: {
            address: { value: mockSafeAddress1 },
            chainId: 'deployment1',
            threshold: 1,
            owners: [{ value: mockAddress1 }, { value: mockAddress3 }], // Private key + Ledger
            fiatTotal: '0',
            queued: 0,
          },
        },
      }

      const result = categorizeOwnersToDelete(mockSafeAddress1, safeWithMixed, mockSigners)

      expect(result.privateKeyOwners).toEqual([mockAddress1])
      expect(result.ledgerOwners).toEqual([mockAddress3])
    })

    it('should exclude owners used in other safes', () => {
      const result = categorizeOwnersToDelete(mockSafeAddress2, mockSafesInfo, mockSigners)

      expect(result.privateKeyOwners).toEqual([]) // mockAddress2 is used in other safes
      expect(result.ledgerOwners).toEqual([mockAddress3])
    })
  })

  describe('cleanupLedgerSigners', () => {
    it('should successfully remove ledger signers from store', () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const ledgerAddresses = [mockAddress3]

      const result = cleanupLedgerSigners(ledgerAddresses, mockDispatch)

      expect(result.success).toBe(true)
      expect(result.data?.processedCount).toBe(1)
      expect(mockDispatch).toHaveBeenCalledWith(removeSigner(mockAddress3))
    })

    it('should handle multiple ledger signers', () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const mockAddress4 = '0x4444444444444444444444444444444444444444' as Address
      const ledgerAddresses = [mockAddress3, mockAddress4]

      const result = cleanupLedgerSigners(ledgerAddresses, mockDispatch)

      expect(result.success).toBe(true)
      expect(result.data?.processedCount).toBe(2)
      expect(mockDispatch).toHaveBeenCalledWith(removeSigner(mockAddress3))
      expect(mockDispatch).toHaveBeenCalledWith(removeSigner(mockAddress4))
    })

    it('should handle empty ledger addresses array', () => {
      const mockDispatch = jest.fn() as unknown as AppDispatch
      const ledgerAddresses: Address[] = []

      const result = cleanupLedgerSigners(ledgerAddresses, mockDispatch)

      expect(result.success).toBe(true)
      expect(result.data?.processedCount).toBe(0)
      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('should handle dispatch errors', () => {
      const mockDispatch = jest.fn().mockImplementation(() => {
        throw new Error('Redux error')
      }) as unknown as AppDispatch
      const ledgerAddresses = [mockAddress3]

      const result = cleanupLedgerSigners(ledgerAddresses, mockDispatch)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.SYSTEM_ERROR)
      expect(result.error?.message).toBe('Failed to remove Ledger signers from store')
    })
  })
})
