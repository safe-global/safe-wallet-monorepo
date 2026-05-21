import { renderHook, act, RootState } from '@/src/tests/test-utils'
import { useNotificationManager } from './useNotificationManager'
import NotificationsService from '@/src/services/notifications/NotificationService'
const mockRegisterForNotifications = jest.fn()
const mockUnregisterForNotifications = jest.fn()
jest.mock('@/src/services/notifications/NotificationService', () => ({
  isDeviceNotificationEnabled: jest.fn(),
  isAuthorizationDenied: jest.fn().mockResolvedValue(false),
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
      [mockedSafeInfo.chainId]: {
        ...mockedSafeInfo,
      },
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

  // Apple 5.1.1(iv): denial paths must surface the in-app explainer Alert (which has an explicit
  // "Turn on" button) instead of auto-opening Settings. See WA-2238.
  describe('Apple 5.1.1(iv) compliance', () => {
    it('toggleNotificationState shows the in-app explainer when permission is denied', async () => {
      jest.mocked(NotificationsService.isDeviceNotificationEnabled).mockResolvedValue(false)
      jest.mocked(NotificationsService.getAllPermissions).mockResolvedValue({
        permission: 'denied',
        blockedNotifications: new Map(),
      })
      const stateUnsubscribed = {
        ...mockState,
        notifications: { ...mockState.notifications, isAppNotificationsEnabled: false },
      } as unknown as RootState
      const { result } = renderHook(() => useNotificationManager(), stateUnsubscribed)

      await act(async () => {
        await result.current.toggleNotificationState()
      })

      expect(NotificationsService.requestPushNotificationsPermission).toHaveBeenCalled()
    })

    // Registration can fail with a granted permission (network, backend); pushing the user to
    // Settings in that case is misleading and leaves pendingPermissionRequestRef stuck true.
    it('toggleNotificationState does NOT show the explainer when registration fails with permission granted', async () => {
      jest.mocked(NotificationsService.isDeviceNotificationEnabled).mockResolvedValue(false)
      jest.mocked(NotificationsService.getAllPermissions).mockResolvedValue({
        permission: 'granted',
        blockedNotifications: new Map(),
      })
      mockRegisterForNotifications.mockResolvedValueOnce({ loading: false, error: new Error('network') })
      const stateUnsubscribed = {
        ...mockState,
        notifications: { ...mockState.notifications, isAppNotificationsEnabled: false },
      } as unknown as RootState
      const { result } = renderHook(() => useNotificationManager(), stateUnsubscribed)

      await act(async () => {
        await result.current.toggleNotificationState()
      })

      expect(NotificationsService.requestPushNotificationsPermission).not.toHaveBeenCalled()
    })

    it('enableNotification shows the in-app explainer once promptThreshold is reached', async () => {
      jest.mocked(NotificationsService.isDeviceNotificationEnabled).mockResolvedValue(false)
      const stateAtThreshold = {
        ...mockState,
        notifications: { ...mockState.notifications, promptAttempts: 5 },
      } as unknown as RootState
      const { result } = renderHook(() => useNotificationManager(), stateAtThreshold)

      await act(async () => {
        await result.current.enableNotification()
      })

      expect(NotificationsService.requestPushNotificationsPermission).toHaveBeenCalled()
      expect(NotificationsService.getAllPermissions).not.toHaveBeenCalled()
    })

    // WA-2238 follow-up: when the user disabled push in iOS Settings and returns to the app,
    // promptAttempts is reset to 0. Without this branch, the hook would call notifee.requestPermission()
    // (a silent no-op once OS auth is DENIED) and the user would have to tap multiple times before
    // the explainer Alert appeared.
    it('enableNotification shows the explainer immediately when OS auth is DENIED, regardless of promptAttempts', async () => {
      jest.mocked(NotificationsService.isDeviceNotificationEnabled).mockResolvedValue(false)
      jest.mocked(NotificationsService.isAuthorizationDenied).mockResolvedValueOnce(true)
      const stateBelowThreshold = {
        ...mockState,
        notifications: { ...mockState.notifications, promptAttempts: 0 },
      } as unknown as RootState
      const { result } = renderHook(() => useNotificationManager(), stateBelowThreshold)

      await act(async () => {
        await result.current.enableNotification()
      })

      expect(NotificationsService.requestPushNotificationsPermission).toHaveBeenCalled()
      expect(NotificationsService.getAllPermissions).not.toHaveBeenCalled()
    })
  })
})
