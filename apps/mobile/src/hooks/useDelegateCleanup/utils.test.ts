import { cleanupDelegateNotifications, removeDelegatesFromBackend, cleanupDelegateKeychain } from './utils'
import { Wallet } from 'ethers'
import { keyStorageService } from '@/src/services/key-storage'
import { getDelegateKeyId } from '@/src/utils/delegate'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { type Address } from '@/src/types/address'
import Logger from '@/src/utils/logger'

// Mock dependencies
jest.mock('@/src/services/key-storage')
jest.mock('@/src/utils/delegate')
jest.mock('@/src/utils/logger')
jest.mock('ethers')

const mockKeyStorageService = keyStorageService as jest.Mocked<typeof keyStorageService>
const mockGetDelegateKeyId = getDelegateKeyId as jest.MockedFunction<typeof getDelegateKeyId>
const mockLogger = Logger as jest.Mocked<typeof Logger>

describe('useDelegateCleanup utils', () => {
  const mockOwnerAddress = '0x123456789abcdef' as Address
  const mockDelegateAddress1 = '0xabcdef123456789' as Address
  const mockDelegateAddress2 = '0xfedcba987654321' as Address
  const mockDelegateAddresses = [mockDelegateAddress1, mockDelegateAddress2]
  const mockChains: Chain[] = [
    {
      chainId: '1',
      chainName: 'Ethereum',
      description: 'Ethereum Mainnet',
      l2: false,
      isTestnet: false,
      zk: false,
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18, logoUri: '' },
      transactionService: 'https://safe-transaction-mainnet.safe.global',
      blockExplorerUriTemplate: { address: '', txHash: '', api: '' },
      ensRegistryAddress: '',
      recommendedMasterCopyVersion: '',
      disabledWallets: [],
      features: [],
      gasPrice: [],
      publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: '' },
      rpcUri: { authentication: 'NO_AUTHENTICATION', value: '' },
      safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: '' },
      shortName: 'eth',
      theme: { textColor: '', backgroundColor: '' },
    } as unknown as Chain,
    {
      chainId: '137',
      chainName: 'Polygon',
      description: 'Polygon Mainnet',
      l2: true,
      isTestnet: false,
      zk: false,
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18, logoUri: '' },
      transactionService: 'https://safe-transaction-polygon.safe.global',
      blockExplorerUriTemplate: { address: '', txHash: '', api: '' },
      ensRegistryAddress: '',
      recommendedMasterCopyVersion: '',
      disabledWallets: [],
      features: [],
      gasPrice: [],
      publicRpcUri: { authentication: 'NO_AUTHENTICATION', value: '' },
      rpcUri: { authentication: 'NO_AUTHENTICATION', value: '' },
      safeAppsRpcUri: { authentication: 'NO_AUTHENTICATION', value: '' },
      shortName: 'matic',
      theme: { textColor: '', backgroundColor: '' },
    } as unknown as Chain,
  ]
  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger.info = jest.fn()
    mockLogger.warn = jest.fn()
    mockLogger.error = jest.fn()
  })

  describe('cleanupDelegateNotifications', () => {
    const mockCleanupNotificationsForDelegate = jest.fn()

    it('should return success when no delegates provided', async () => {
      const result = await cleanupDelegateNotifications(mockOwnerAddress, [], mockCleanupNotificationsForDelegate)

      expect(result.success).toBe(true)
      expect(mockCleanupNotificationsForDelegate).not.toHaveBeenCalled()
    })

    it('should successfully cleanup notifications for all delegates', async () => {
      mockCleanupNotificationsForDelegate.mockResolvedValue({ success: true })

      const result = await cleanupDelegateNotifications(
        mockOwnerAddress,
        mockDelegateAddresses,
        mockCleanupNotificationsForDelegate,
      )

      expect(result.success).toBe(true)
      expect(mockCleanupNotificationsForDelegate).toHaveBeenCalledTimes(2)
      expect(mockCleanupNotificationsForDelegate).toHaveBeenCalledWith(mockOwnerAddress, mockDelegateAddress1)
      expect(mockCleanupNotificationsForDelegate).toHaveBeenCalledWith(mockOwnerAddress, mockDelegateAddress2)
    })

    it('should handle notification cleanup failures', async () => {
      mockCleanupNotificationsForDelegate
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: { message: 'Network error' } })

      const result = await cleanupDelegateNotifications(
        mockOwnerAddress,
        mockDelegateAddresses,
        mockCleanupNotificationsForDelegate,
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
      expect(result.failedDelegates).toContain(mockDelegateAddress2)
    })

    it('should handle exceptions during notification cleanup', async () => {
      mockCleanupNotificationsForDelegate.mockRejectedValue(new Error('API error'))

      const result = await cleanupDelegateNotifications(
        mockOwnerAddress,
        mockDelegateAddresses,
        mockCleanupNotificationsForDelegate,
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('API error')
      expect(result.failedDelegates).toEqual(mockDelegateAddresses)
    })
  })

  describe('removeDelegatesFromBackend', () => {
    const mockOwnerWallet = new Wallet('0x123')
    const mockDeleteDelegate = jest.fn()
    const mockSignTypedData = jest.fn()

    beforeEach(() => {
      mockOwnerWallet.signTypedData = mockSignTypedData
      mockSignTypedData.mockResolvedValue('0xsignature')
      mockDeleteDelegate.mockResolvedValue({})
    })

    it('should return success when no delegates provided', async () => {
      const result = await removeDelegatesFromBackend(
        mockOwnerAddress,
        [],
        mockOwnerWallet,
        mockChains,
        mockDeleteDelegate,
      )

      expect(result.success).toBe(true)
      expect(mockDeleteDelegate).not.toHaveBeenCalled()
    })

    it('should successfully remove delegates from all chains', async () => {
      const resultPromise = removeDelegatesFromBackend(
        mockOwnerAddress,
        mockDelegateAddresses,
        mockOwnerWallet,
        mockChains,
        mockDeleteDelegate,
      )

      // Fast-forward through all timers (delays between delegates and chains)
      await jest.advanceTimersByTimeAsync(10000)

      const result = await resultPromise

      expect(result.success).toBe(true)
      // 2 delegates * 2 chains = 4 calls
      expect(mockDeleteDelegate).toHaveBeenCalledTimes(4)
    })

    it('should handle API failures and retry', async () => {
      mockDeleteDelegate.mockRejectedValueOnce(new Error('429 rate limit')).mockResolvedValue({})

      const resultPromise = removeDelegatesFromBackend(
        mockOwnerAddress,
        [mockDelegateAddress1],
        mockOwnerWallet,
        [mockChains[0]],
        mockDeleteDelegate,
      )

      // Fast-forward through all timers (retry delays and delegation delays)
      await jest.advanceTimersByTimeAsync(10000)

      const result = await resultPromise

      expect(result.success).toBe(true)
      expect(mockDeleteDelegate).toHaveBeenCalledTimes(2) // First call fails, second succeeds
    })

    it('should handle persistent API failures', async () => {
      mockDeleteDelegate.mockReset().mockRejectedValue(new Error('Persistent error'))

      const resultPromise = removeDelegatesFromBackend(
        mockOwnerAddress,
        [mockDelegateAddress1],
        mockOwnerWallet,
        [mockChains[0]],
        mockDeleteDelegate,
      )

      // Fast-forward through all timers (retry delays and delegation delays)
      await jest.advanceTimersByTimeAsync(10000)

      const result = await resultPromise

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to remove 1 out of 1 delegates')
      expect(result.failedDelegates).toContain(mockDelegateAddress1)
    })
  })

  describe('cleanupDelegateKeychain', () => {
    beforeEach(() => {
      mockGetDelegateKeyId.mockReturnValue('mock-key-id')
      mockKeyStorageService.removePrivateKey.mockResolvedValue()
    })

    it('should return success when no delegates provided', async () => {
      const result = await cleanupDelegateKeychain(mockOwnerAddress, [])

      expect(result.success).toBe(true)
      expect(mockKeyStorageService.removePrivateKey).not.toHaveBeenCalled()
    })

    it('should successfully remove all delegate keys from keychain', async () => {
      const result = await cleanupDelegateKeychain(mockOwnerAddress, mockDelegateAddresses)

      expect(result.success).toBe(true)
      expect(mockKeyStorageService.removePrivateKey).toHaveBeenCalledTimes(2)
      expect(mockGetDelegateKeyId).toHaveBeenCalledWith(mockOwnerAddress, mockDelegateAddress1)
      expect(mockGetDelegateKeyId).toHaveBeenCalledWith(mockOwnerAddress, mockDelegateAddress2)
    })

    it('should handle keychain removal failures gracefully', async () => {
      mockKeyStorageService.removePrivateKey.mockResolvedValueOnce().mockRejectedValueOnce(new Error('Keychain error'))

      const result = await cleanupDelegateKeychain(mockOwnerAddress, mockDelegateAddresses)

      expect(result.success).toBe(true) // Should still succeed as keychain cleanup is not critical
      expect(result.failedDelegates).toContain(mockDelegateAddress2)
    })

    it('should handle unexpected errors during keychain cleanup', async () => {
      mockKeyStorageService.removePrivateKey.mockRejectedValue(new Error('Unexpected error'))

      const result = await cleanupDelegateKeychain(mockOwnerAddress, mockDelegateAddresses)

      expect(result.success).toBe(true) // Should still succeed as keychain cleanup is not critical
      expect(result.failedDelegates).toEqual(mockDelegateAddresses)
    })
  })
})
