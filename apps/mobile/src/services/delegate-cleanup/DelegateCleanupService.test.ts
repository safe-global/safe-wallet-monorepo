import {
  DelegateCleanupService,
  DelegateCleanupPhase,
  DelegateCleanupErrorType,
  type DelegateCleanupError,
} from './DelegateCleanupService'
import {
  cleanupDelegateNotifications,
  removeDelegatesFromBackend,
  cleanupDelegateKeychain,
} from '@/src/hooks/useDelegateCleanup/utils'
import { removeDelegate } from '@/src/store/delegatesSlice'
import { Wallet } from 'ethers'
import Logger from '@/src/utils/logger'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { type Address } from '@/src/types/address'
import { type DelegateInfo } from '@/src/store/delegatesSlice'
import { ErrorType } from '@/src/utils/errors'

// Mock dependencies
jest.mock('@/src/hooks/useDelegateCleanup/utils')
jest.mock('@/src/store/delegatesSlice')
jest.mock('@/src/utils/logger')
jest.mock('ethers')

const mockCleanupDelegateNotifications = cleanupDelegateNotifications as jest.MockedFunction<
  typeof cleanupDelegateNotifications
>
const mockRemoveDelegatesFromBackend = removeDelegatesFromBackend as jest.MockedFunction<
  typeof removeDelegatesFromBackend
>
const mockCleanupDelegateKeychain = cleanupDelegateKeychain as jest.MockedFunction<typeof cleanupDelegateKeychain>
const mockRemoveDelegate = removeDelegate as jest.MockedFunction<typeof removeDelegate>
const mockLogger = Logger as jest.Mocked<typeof Logger>

describe('DelegateCleanupService', () => {
  const mockOwnerAddress = '0x123456789abcdef' as Address
  const mockOwnerPrivateKey = '0xprivatekey123456789abcdef'
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
  ]

  const mockDelegates: Record<Address, Record<string, DelegateInfo>> = {
    [mockOwnerAddress]: {
      [mockDelegateAddress1]: {
        safe: '0xsafe1',
        delegate: mockDelegateAddress1,
        delegator: mockOwnerAddress,
        label: 'Delegate 1',
      },
      [mockDelegateAddress2]: {
        safe: '0xsafe2',
        delegate: mockDelegateAddress2,
        delegator: mockOwnerAddress,
        label: 'Delegate 2',
      },
    },
  }

  const mockConfig = {
    allChains: mockChains,
    allDelegates: mockDelegates,
    cleanupNotificationsForDelegate: jest.fn(),
    deleteDelegate: jest.fn(),
    dispatch: jest.fn(),
    onProgress: jest.fn(),
  }

  let service: DelegateCleanupService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new DelegateCleanupService(mockConfig)

    // Mock Wallet constructor
    ;(Wallet as unknown as jest.Mock).mockImplementation(() => ({
      signTypedData: jest.fn().mockResolvedValue('0xmockedsignature'),
    }))

    // Default mock implementations
    mockCleanupDelegateNotifications.mockResolvedValue({ success: true })
    mockRemoveDelegatesFromBackend.mockResolvedValue({ success: true })
    mockCleanupDelegateKeychain.mockResolvedValue({ success: true })
    mockRemoveDelegate.mockReturnValue({
      type: 'delegates/removeDelegate' as const,
      payload: { ownerAddress: mockOwnerAddress, delegateAddress: mockDelegateAddress1 },
    })
  })

  describe('removeAllDelegatesForOwner', () => {
    it('should return validation error when owner address is missing', async () => {
      const result = await service.removeAllDelegatesForOwner('' as Address, mockOwnerPrivateKey)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.VALIDATION_ERROR)
      expect(result.error?.message).toBe('Owner address and private key are required')
    })

    it('should return validation error when private key is missing', async () => {
      const result = await service.removeAllDelegatesForOwner(mockOwnerAddress, '')

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.VALIDATION_ERROR)
      expect(result.error?.message).toBe('Owner address and private key are required')
    })

    it('should return success with 0 processed when no delegates found', async () => {
      const emptyConfig = {
        ...mockConfig,
        allDelegates: {},
      }
      const emptyService = new DelegateCleanupService(emptyConfig)

      const result = await emptyService.removeAllDelegatesForOwner(mockOwnerAddress, mockOwnerPrivateKey)

      expect(result.success).toBe(true)
      expect(result.data?.processedCount).toBe(0)
      expect(mockConfig.onProgress).toHaveBeenCalledWith({
        phase: DelegateCleanupPhase.COMPLETED,
        message: 'No delegates to clean up',
        completedDelegates: undefined,
        totalDelegates: undefined,
      })
    })

    it('should successfully orchestrate all cleanup phases', async () => {
      const result = await service.removeAllDelegatesForOwner(mockOwnerAddress, mockOwnerPrivateKey)

      expect(result.success).toBe(true)
      expect(result.data?.processedCount).toBe(2)

      // Verify progress callbacks
      expect(mockConfig.onProgress).toHaveBeenCalledWith({
        phase: DelegateCleanupPhase.CLEANING_NOTIFICATIONS,
        message: expect.any(String),
        completedDelegates: 0,
        totalDelegates: 2,
      })
      expect(mockConfig.onProgress).toHaveBeenCalledWith({
        phase: DelegateCleanupPhase.REMOVING_FROM_BACKEND,
        message: expect.any(String),
        completedDelegates: 0,
        totalDelegates: 2,
      })
      expect(mockConfig.onProgress).toHaveBeenCalledWith({
        phase: DelegateCleanupPhase.CLEANING_KEYCHAIN,
        message: expect.any(String),
        completedDelegates: 0,
        totalDelegates: 2,
      })
      expect(mockConfig.onProgress).toHaveBeenCalledWith({
        phase: DelegateCleanupPhase.UPDATING_STORE,
        message: expect.any(String),
        completedDelegates: 0,
        totalDelegates: 2,
      })
      expect(mockConfig.onProgress).toHaveBeenCalledWith({
        phase: DelegateCleanupPhase.COMPLETED,
        message: expect.any(String),
        completedDelegates: 2,
        totalDelegates: 2,
      })

      // Verify cleanup functions were called
      expect(mockCleanupDelegateNotifications).toHaveBeenCalledWith(
        mockOwnerAddress,
        mockDelegateAddresses,
        mockConfig.cleanupNotificationsForDelegate,
      )
      expect(mockRemoveDelegatesFromBackend).toHaveBeenCalledWith(
        mockOwnerAddress,
        mockDelegateAddresses,
        expect.objectContaining({ signTypedData: expect.any(Function) }),
        mockChains,
        mockConfig.deleteDelegate,
      )
      expect(mockCleanupDelegateKeychain).toHaveBeenCalledWith(mockOwnerAddress, mockDelegateAddresses)

      // Verify Redux store updates
      expect(mockConfig.dispatch).toHaveBeenCalledTimes(2)
      expect(mockRemoveDelegate).toHaveBeenCalledWith({
        ownerAddress: mockOwnerAddress,
        delegateAddress: mockDelegateAddress1,
      })
      expect(mockRemoveDelegate).toHaveBeenCalledWith({
        ownerAddress: mockOwnerAddress,
        delegateAddress: mockDelegateAddress2,
      })
    })

    it('should fail if notification cleanup fails', async () => {
      mockCleanupDelegateNotifications.mockResolvedValue({
        success: false,
        error: 'Network error during notification cleanup',
        failedDelegates: [mockDelegateAddress1],
      })

      const result = await service.removeAllDelegatesForOwner(mockOwnerAddress, mockOwnerPrivateKey)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.CLEANUP_ERROR)
      expect(result.error?.message).toBe('Network error during notification cleanup')
      expect(result.error?.details?.failedDelegates).toEqual([mockDelegateAddress1])
      // Check the original error is a DelegateCleanupError
      const originalError = result.error?.originalError as DelegateCleanupError
      expect(originalError?.type).toBe(DelegateCleanupErrorType.NOTIFICATION_CLEANUP_FAILED)

      // Verify that subsequent phases were not executed
      expect(mockRemoveDelegatesFromBackend).not.toHaveBeenCalled()
      expect(mockCleanupDelegateKeychain).not.toHaveBeenCalled()
      expect(mockConfig.dispatch).not.toHaveBeenCalled()
    })

    it('should continue with keychain cleanup even if backend removal fails', async () => {
      mockRemoveDelegatesFromBackend.mockResolvedValue({
        success: false,
        error: 'API error during backend removal',
        failedDelegates: [mockDelegateAddress2],
      })

      const result = await service.removeAllDelegatesForOwner(mockOwnerAddress, mockOwnerPrivateKey)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.CLEANUP_ERROR)
      expect(result.error?.message).toBe('API error during backend removal')
      expect(result.error?.details?.failedDelegates).toEqual([mockDelegateAddress2])
      // Check the original error is a DelegateCleanupError
      const originalError = result.error?.originalError as DelegateCleanupError
      expect(originalError?.type).toBe(DelegateCleanupErrorType.BACKEND_REMOVAL_FAILED)

      // Verify that notification cleanup succeeded
      expect(mockCleanupDelegateNotifications).toHaveBeenCalled()

      // Verify that keychain cleanup was still attempted
      expect(mockCleanupDelegateKeychain).toHaveBeenCalledWith(mockOwnerAddress, mockDelegateAddresses)

      // Verify Redux store was still updated
      expect(mockConfig.dispatch).toHaveBeenCalledTimes(2)
    })

    it('should update Redux store for all delegates', async () => {
      await service.removeAllDelegatesForOwner(mockOwnerAddress, mockOwnerPrivateKey)

      expect(mockConfig.dispatch).toHaveBeenCalledTimes(2)
      expect(mockRemoveDelegate).toHaveBeenCalledWith({
        ownerAddress: mockOwnerAddress,
        delegateAddress: mockDelegateAddress1,
      })
      expect(mockRemoveDelegate).toHaveBeenCalledWith({
        ownerAddress: mockOwnerAddress,
        delegateAddress: mockDelegateAddress2,
      })
    })

    it('should handle unexpected errors during cleanup', async () => {
      mockCleanupDelegateNotifications.mockRejectedValue(new Error('Unexpected error'))

      const result = await service.removeAllDelegatesForOwner(mockOwnerAddress, mockOwnerPrivateKey)

      expect(result.success).toBe(false)
      expect(result.error?.type).toBe(ErrorType.SYSTEM_ERROR)
      expect(result.error?.message).toBe('An unexpected error occurred during delegate cleanup')
      expect(mockLogger.error).toHaveBeenCalledWith('Unexpected error during delegate cleanup', expect.any(Error))
    })

    it('should create wallet with correct private key', async () => {
      await service.removeAllDelegatesForOwner(mockOwnerAddress, mockOwnerPrivateKey)

      expect(Wallet).toHaveBeenCalledWith(mockOwnerPrivateKey)
    })

    it('should pass correct parameters to cleanup functions', async () => {
      await service.removeAllDelegatesForOwner(mockOwnerAddress, mockOwnerPrivateKey)

      // Verify cleanup notifications
      expect(mockCleanupDelegateNotifications).toHaveBeenCalledWith(
        mockOwnerAddress,
        mockDelegateAddresses,
        mockConfig.cleanupNotificationsForDelegate,
      )

      // Verify backend removal
      expect(mockRemoveDelegatesFromBackend).toHaveBeenCalledWith(
        mockOwnerAddress,
        mockDelegateAddresses,
        expect.objectContaining({ signTypedData: expect.any(Function) }),
        mockConfig.allChains,
        mockConfig.deleteDelegate,
      )

      // Verify keychain cleanup
      expect(mockCleanupDelegateKeychain).toHaveBeenCalledWith(mockOwnerAddress, mockDelegateAddresses)
    })
  })
})
