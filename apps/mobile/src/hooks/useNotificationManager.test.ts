import { renderHook, act, RootState } from '@/src/tests/test-utils'
import { useNotificationManager } from './useNotificationManager'
import NotificationsService from '@/src/services/notifications/NotificationService'

const mockRegisterForNotifications = jest.fn()
const mockUnregisterForNotifications = jest.fn()

jest.mock('@/src/services/notifications/NotificationService', () => ({
  isDeviceNotificationEnabled: jest.fn(),
  getAllPermissions: jest.fn(),
  requestPushNotificationsPermission: jest.fn(),
}))

jest.mock('@/src/hooks/useRegisterForNotifications', () => ({
  __esModule: true,
  default: () => ({
    registerForNotifications: mockRegisterForNotifications,
    unregisterForNotifications: mockUnregisterForNotifications,
    isLoading: false,
    error: null,
  }),
}))

const mockedSafeInfo = {
  address: { value: '0x123' as `0x${string}`, name: 'Test Safe' },
  threshold: 1,
  owners: [{ value: '0x456' as `0x${string}` }],
  fiatTotal: '1000',
  chainId: '1',
  queued: 0,
}
const mockState = {
  safes: {
    [mockedSafeInfo.address.value]: {
      chains: [mockedSafeInfo.chainId],
      SafeInfo: mockedSafeInfo,
    },
  },
  signers: {
    [mockedSafeInfo.owners[0].value]: {
      address: mockedSafeInfo.owners[0].value,
      name: 'Test Safe',
    },
  },
  settings: {
    themePreference: 'auto',
  },
  notifications: {
    isAppNotificationsEnabled: true,
    isDeviceNotificationsEnabled: true,
  },
  activeSafe: {
    address: mockedSafeInfo.address.value,
    chainId: mockedSafeInfo.chainId,
  },
} as unknown as RootState

describe('useNotificationManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
<<<<<<< HEAD
    mockUseAppSelector.mockImplementation((selector: unknown) => {
      if (selector === selectAppNotificationStatus) {
        return mockedState.isAppNotificationEnabled
      }
      return {
        '1': mockedState.SafeInfo,
      }
    })

    jest.mocked(NotificationsService.isDeviceNotificationEnabled).mockResolvedValue(true)

    mockRegisterForNotifications.mockResolvedValue({ loading: false, error: null })
    mockUnregisterForNotifications.mockResolvedValue({ loading: false, error: null })

    jest.mocked(toggleAppNotifications).mockReturnValue({ payload: true, type: 'notifications/toggleAppNotifications' })
    jest.mocked(updatePromptAttempts).mockReturnValue({ payload: 0, type: 'notifications/updatePromptAttempts' })
    jest
      .mocked(updateLastTimePromptAttempted)
      .mockReturnValue({ payload: null, type: 'notifications/updateLastTimePromptAttempted' })
=======
>>>>>>> 4aa16bdcc (fix(mobile): register for queue notifications)
  })

  it('returns the correct notification status', () => {
    const { result } = renderHook(() => useNotificationManager(), mockState)
    expect(result.current.isAppNotificationEnabled).toBe(true)
  })

  it('handles errors when enabling notifications', async () => {
    jest.mocked(NotificationsService.isDeviceNotificationEnabled).mockRejectedValueOnce(new Error('Test error'))

    const { result } = renderHook(() => useNotificationManager())

    await act(async () => {
      const success = await result.current.enableNotification()
      expect(success).toBe(false)
    })
  })
})
