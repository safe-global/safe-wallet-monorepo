/**
 * Unit tests for NotificationNavigationHandler
 * This test file is isolated and mocks all dependencies to avoid complex setup issues
 */
import { NotificationType } from '@safe-global/store/gateway/AUTO_GENERATED/notifications'
import { Address } from '@/src/types/address'

// Define types for test data
interface MockActiveSafeAction {
  type: string
  payload: {
    address: Address
    chainId: string
  }
}

interface TestNotificationData {
  type: NotificationType | string
  chainId: string
  address: string
  safeTxHash?: string
}

describe('NotificationNavigationHandler', () => {
  // Mock all external dependencies
  const mockRouter = {
    push: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
    dismissAll: jest.fn(),
  }

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const mockStore = {
    getState: jest.fn(),
    dispatch: jest.fn(),
  }

  const mockSelectAllSafes = jest.fn()
  const mockSetActiveSafe = jest.fn(
    (payload: { address: Address; chainId: string }): MockActiveSafeAction => ({
      type: 'activeSafe/setActiveSafe',
      payload,
    }),
  )

  // Set up mocks before importing the module
  beforeAll(() => {
    jest.doMock('expo-router', () => ({
      router: mockRouter,
    }))

    jest.doMock('@/src/utils/logger', () => ({
      __esModule: true,
      default: mockLogger,
    }))

    jest.doMock('@/src/store/utils/singletonStore', () => ({
      getStore: () => mockStore,
    }))

    jest.doMock('@/src/store/activeSafeSlice', () => ({
      setActiveSafe: mockSetActiveSafe,
    }))

    jest.doMock('@/src/store/safesSlice', () => ({
      selectAllSafes: mockSelectAllSafes,
    }))

    // Mock the setTimeout to resolve immediately in tests
    global.setTimeout = jest.fn((callback: () => void) => {
      callback()
      return 1 as unknown as NodeJS.Timeout
    }) as unknown as typeof global.setTimeout
  })

  const mockAddress = '0x1234567890123456789012345678901234567890' as Address
  const mockChainId = '1'
  const mockSafeTxHash = 'tx-hash-123'

  const mockSafesState = {
    [mockAddress]: {
      [mockChainId]: {
        address: { value: mockAddress },
        chainId: mockChainId,
        threshold: 1,
        owners: [],
        fiatTotal: '0',
        queued: 0,
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockStore.getState.mockReturnValue({})
    mockSelectAllSafes.mockReturnValue(mockSafesState)
    mockRouter.canGoBack.mockReturnValue(true)
  })

  // Import the handler after mocks are set up
  let NotificationNavigationHandler: typeof import('../notificationNavigationHandler').NotificationNavigationHandler
  beforeAll(() => {
    NotificationNavigationHandler = require('../notificationNavigationHandler').NotificationNavigationHandler
  })

  describe('switchToSafe', () => {
    it('should switch to the correct safe successfully', async () => {
      await NotificationNavigationHandler.switchToSafe(mockAddress, mockChainId)

      expect(mockStore.dispatch).toHaveBeenCalled()
    })

    it('should throw error when safe does not exist in user wallet', async () => {
      mockSelectAllSafes.mockReturnValue({})

      await expect(NotificationNavigationHandler.switchToSafe(mockAddress, mockChainId)).rejects.toThrow(
        'Safe not found in user wallet',
      )

      expect(mockStore.dispatch).not.toHaveBeenCalled()
    })
  })

  describe('handleNotificationPress edge cases', () => {
    it('should handle missing notification data gracefully', async () => {
      await NotificationNavigationHandler.handleNotificationPress(undefined)
    })

    it('should handle missing required fields gracefully', async () => {
      const incompleteData = {
        type: 'INCOMING_ETHER' as NotificationType,
        // Missing chainId and address
      }

      await NotificationNavigationHandler.handleNotificationPress(incompleteData)
    })
  })

  describe('navigation methods', () => {
    it('should test navigateToTransactionHistory calls safeNavigate with correct path', async () => {
      // Mock safeNavigate to track calls
      const originalSafeNavigate = NotificationNavigationHandler.safeNavigate
      const safeNavigateMock = jest.fn().mockResolvedValue(undefined)
      NotificationNavigationHandler.safeNavigate = safeNavigateMock

      await NotificationNavigationHandler.navigateToTransactionHistory()

      expect(safeNavigateMock).toHaveBeenCalledWith({
        pathname: '/transactions',
        params: { fromNotification: expect.any(String) },
      })

      // Restore original
      NotificationNavigationHandler.safeNavigate = originalSafeNavigate
    })

    it('should test navigateToConfirmTransaction with safeTxHash', async () => {
      const originalSafeNavigate = NotificationNavigationHandler.safeNavigate
      const safeNavigateMock = jest.fn().mockResolvedValue(undefined)
      NotificationNavigationHandler.safeNavigate = safeNavigateMock

      await NotificationNavigationHandler.navigateToConfirmTransaction(mockSafeTxHash)

      expect(safeNavigateMock).toHaveBeenCalledWith({
        pathname: '/confirm-transaction',
        params: { txId: mockSafeTxHash },
      })

      NotificationNavigationHandler.safeNavigate = originalSafeNavigate
    })

    it('should test navigateToConfirmTransaction without safeTxHash', async () => {
      const originalSafeNavigate = NotificationNavigationHandler.safeNavigate
      const safeNavigateMock = jest.fn().mockResolvedValue(undefined)
      NotificationNavigationHandler.safeNavigate = safeNavigateMock

      await NotificationNavigationHandler.navigateToConfirmTransaction()

      expect(safeNavigateMock).toHaveBeenCalledWith('/pending-transactions')

      NotificationNavigationHandler.safeNavigate = originalSafeNavigate
    })
  })

  describe('handleNotificationPress with various notification types', () => {
    it('should handle INCOMING_ETHER notification correctly', async () => {
      // Mock the internal methods
      const switchToSafeMock = jest.fn().mockResolvedValue(undefined)
      const navigateToTransactionHistoryMock = jest.fn().mockResolvedValue(undefined)
      NotificationNavigationHandler.switchToSafe = switchToSafeMock
      NotificationNavigationHandler.navigateToTransactionHistory = navigateToTransactionHistoryMock

      const notificationData: TestNotificationData = {
        type: 'INCOMING_ETHER' as NotificationType,
        chainId: mockChainId,
        address: mockAddress,
      }

      await NotificationNavigationHandler.handleNotificationPress(
        notificationData as unknown as Record<string, string | object>,
      )

      expect(switchToSafeMock).toHaveBeenCalledWith(mockAddress, mockChainId)
      expect(navigateToTransactionHistoryMock).toHaveBeenCalled()
    })

    it('should handle CONFIRMATION_REQUEST notification correctly', async () => {
      const switchToSafeMock = jest.fn().mockResolvedValue(undefined)
      const navigateToConfirmTransactionMock = jest.fn().mockResolvedValue(undefined)
      NotificationNavigationHandler.switchToSafe = switchToSafeMock
      NotificationNavigationHandler.navigateToConfirmTransaction = navigateToConfirmTransactionMock

      const notificationData: TestNotificationData = {
        type: 'CONFIRMATION_REQUEST' as NotificationType,
        chainId: mockChainId,
        address: mockAddress,
        safeTxHash: mockSafeTxHash,
      }

      await NotificationNavigationHandler.handleNotificationPress(
        notificationData as unknown as Record<string, string | object>,
      )

      expect(switchToSafeMock).toHaveBeenCalledWith(mockAddress, mockChainId)
      expect(navigateToConfirmTransactionMock).toHaveBeenCalledWith(mockSafeTxHash)
    })

    it('should handle unknown notification type with fallback navigation', async () => {
      const switchToSafeMock = jest.fn().mockResolvedValue(undefined)
      const safeNavigateMock = jest.fn().mockResolvedValue(undefined)
      NotificationNavigationHandler.switchToSafe = switchToSafeMock
      NotificationNavigationHandler.safeNavigate = safeNavigateMock

      const notificationData: TestNotificationData = {
        type: 'UNKNOWN_TYPE',
        chainId: mockChainId,
        address: mockAddress,
      }

      await NotificationNavigationHandler.handleNotificationPress(
        notificationData as unknown as Record<string, string | object>,
      )

      expect(switchToSafeMock).toHaveBeenCalledWith(mockAddress, mockChainId)
      expect(safeNavigateMock).toHaveBeenCalledWith('/')
    })

    it('should handle errors during navigation and fallback to home', async () => {
      const switchToSafeMock = jest.fn().mockRejectedValue(new Error('Switch failed'))
      const safeNavigateMock = jest.fn().mockResolvedValue(undefined)
      NotificationNavigationHandler.switchToSafe = switchToSafeMock
      NotificationNavigationHandler.safeNavigate = safeNavigateMock

      const notificationData: TestNotificationData = {
        type: 'INCOMING_ETHER' as NotificationType,
        chainId: mockChainId,
        address: mockAddress,
      }

      await NotificationNavigationHandler.handleNotificationPress(
        notificationData as unknown as Record<string, string | object>,
      )

      expect(safeNavigateMock).toHaveBeenCalledWith('/')
    })
  })
})
