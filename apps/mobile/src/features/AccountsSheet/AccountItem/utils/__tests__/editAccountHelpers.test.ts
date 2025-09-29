import {
  isOwnerInOtherSafes,
  getSafeOwnersWithPrivateKeys,
  getOwnersToDelete,
  createDeletionMessage,
  cleanupSinglePrivateKey,
  cleanupPrivateKeysForOwners,
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
      /* private key data */
    },
    [mockAddress2]: {
      /* private key data */
    },
    // mockAddress3 has no private key stored
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
      const safeWithNoPrivateKeys = {
        [mockSafeAddress1]: {
          deployment1: {
            address: { value: mockSafeAddress1 },
            chainId: 'deployment1',
            threshold: 1,
            owners: [{ value: mockAddress3 }],
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

    it('should return empty array when all owners are used in other safes', () => {
      const result = getOwnersToDelete(mockSafeAddress2, mockSafesInfo, mockSigners)
      expect(result).toEqual([]) // mockAddress2 is used in other safes, mockAddress3 has no private key
    })
  })

  describe('createDeletionMessage', () => {
    it('should create message for partial deletion', () => {
      const ownersWithPrivateKeys = [mockAddress1, mockAddress2]
      const ownersToDelete = [mockAddress1]

      const result = createDeletionMessage(ownersWithPrivateKeys, ownersToDelete)

      expect(result).toContain('2 owner(s) with private keys')
      expect(result).toContain('1 of these private key(s) will be deleted')
      expect(result).toContain('1 private key(s) will be kept')
      expect(result).toContain('cannot be undone')
    })

    it('should create message for full deletion', () => {
      const ownersWithPrivateKeys = [mockAddress1]
      const ownersToDelete = [mockAddress1]

      const result = createDeletionMessage(ownersWithPrivateKeys, ownersToDelete)

      expect(result).toContain('1 owner(s) with private keys')
      expect(result).toContain('1 of these private key(s) will be deleted')
      expect(result).not.toContain('will be kept')
    })

    it('should create message for no deletion', () => {
      const ownersWithPrivateKeys = [mockAddress1, mockAddress2]
      const ownersToDelete: Address[] = []

      const result = createDeletionMessage(ownersWithPrivateKeys, ownersToDelete)

      expect(result).toContain('2 owner(s) with private keys')
      expect(result).not.toContain('will be deleted')
      expect(result).toContain('2 private key(s) will be kept')
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
})
