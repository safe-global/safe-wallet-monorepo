import { renderHook, act } from '@/src/tests/test-utils'
import { useNotificationManager } from './useNotificationManager'
import {
  selectAppNotificationStatus,
  toggleAppNotifications,
  updateLastTimePromptAttempted,
  updatePromptAttempts,
} from '@/src/store/notificationsSlice'
import NotificationsService from '@/src/services/notifications/NotificationService'

const mockedState = {
  SafeInfo: {
    address: { value: '0x123' as `0x${string}`, name: 'Test Safe' },
    threshold: 1,
    owners: [{ value: '0x456' as `0x${string}` }],
    fiatTotal: '1000',
    chainId: '1',
    queued: 0,
  },
  signers: {
    '0x456': true,
  },
  isAppNotificationEnabled: true,
}

const mockDispatch = jest.fn()
const mockUseAppSelector = jest.fn()
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

jest.mock('@/src/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: unknown) => mockUseAppSelector(selector),
}))

jest.mock('@/src/store/notificationsSlice', () => ({
  selectAppNotificationStatus: jest.fn(),
  toggleAppNotifications: jest.fn(),
  updatePromptAttempts: jest.fn(),
  updateLastTimePromptAttempted: jest.fn(),
}))

describe('useNotificationManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
  })

  it('returns the correct notification status', () => {
    const { result } = renderHook(() => useNotificationManager())
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
