import { toBeHex } from 'ethers'
import { useNotificationsRenewal } from '../useNotificationsRenewal'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as store from '@/store'
import * as useNotificationsTokenVersion from '../useNotificationsTokenVersion'
import * as useNotificationRegistrations from '../useNotificationRegistrations'
import * as useNotificationPreferences from '../useNotificationPreferences'
import * as notificationsSlice from '@/store/notificationsSlice'
import { NotificationsTokenVersion } from '@/services/push-notifications/preferences'
import { renderHook, waitFor } from '@testing-library/react'
import { RENEWAL_NOTIFICATION_KEY } from '../../constants'

const { V1, V2 } = NotificationsTokenVersion

describe('useNotificationsRenewal', () => {
  const chainId1 = '123'
  const chainId2 = '234'

  const safeAddress1 = toBeHex('0x1', 20)
  const safeAddress2 = toBeHex('0x2', 20)
  const safeAddress3 = toBeHex('0x3', 20)

  const useSafeInfoSpy = jest.spyOn(useSafeInfoHook, 'default')
  const useAppDispatchSpy = jest.spyOn(store, 'useAppDispatch')
  const useNotificationsTokenVersionSpy = jest.spyOn(useNotificationsTokenVersion, 'useNotificationsTokenVersion')
  const useNotificationRegistrationsSpy = jest.spyOn(useNotificationRegistrations, 'useNotificationRegistrations')
  const useNotificationPreferencesSpy = jest.spyOn(useNotificationPreferences, 'useNotificationPreferences')
  const useIsNotificationsRenewalEnabledSpy = jest.spyOn(
    useNotificationsTokenVersion,
    'useIsNotificationsRenewalEnabled',
  )
  const showNotificationSpy = jest.spyOn(notificationsSlice, 'showNotification')
  const selectNotificationsSpy = jest.spyOn(notificationsSlice, 'selectNotifications')

  const dispatchMock = jest.fn()
  const registerNotificationsMock = jest.fn().mockResolvedValue(undefined)
  const preferencesMock = {
    [`${chainId1}:${safeAddress1}`]: {
      chainId: chainId1,
      safeAddress: safeAddress1,
      preferences: useNotificationPreferences.DEFAULT_NOTIFICATION_PREFERENCES,
    },
    [`${chainId1}:${safeAddress2}`]: {
      chainId: chainId1,
      safeAddress: safeAddress2,
      preferences: useNotificationPreferences.DEFAULT_NOTIFICATION_PREFERENCES,
    },
    [`${chainId1}:${safeAddress3}`]: {
      chainId: chainId1,
      safeAddress: safeAddress3,
      preferences: useNotificationPreferences.DEFAULT_NOTIFICATION_PREFERENCES,
    },
    [`${chainId2}:${safeAddress1}`]: {
      chainId: chainId2,
      safeAddress: safeAddress1,
      preferences: useNotificationPreferences.DEFAULT_NOTIFICATION_PREFERENCES,
    },
  }
  const getAllPreferencesMock = jest.fn().mockReturnValue(preferencesMock)
  const getChainPreferencesMock = jest
    .fn()
    .mockReturnValue([
      preferencesMock[`${chainId1}:${safeAddress1}`],
      preferencesMock[`${chainId1}:${safeAddress2}`],
      preferencesMock[`${chainId1}:${safeAddress3}`],
    ])

  const notificationsTokenVersionMock = {
    safeTokenVersion: undefined,
    allTokenVersions: { [chainId1]: { [safeAddress2]: V2, [safeAddress3]: V1 }, [chainId2]: { [safeAddress1]: V1 } },
    setTokenVersion: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    useSafeInfoSpy.mockReturnValue({
      safe: {
        chainId: chainId1,
        address: { value: safeAddress1 },
      },
      safeLoaded: true,
    } as unknown as ReturnType<typeof useSafeInfoHook.default>)

    useNotificationRegistrationsSpy.mockReturnValue({
      registerNotifications: registerNotificationsMock,
    } as unknown as ReturnType<(typeof useNotificationRegistrations)['useNotificationRegistrations']>)

    useNotificationPreferencesSpy.mockReturnValue({
      getAllPreferences: getAllPreferencesMock,
      getChainPreferences: getChainPreferencesMock,
    } as unknown as ReturnType<(typeof useNotificationPreferences)['useNotificationPreferences']>)

    selectNotificationsSpy.mockReturnValue({} as ReturnType<(typeof notificationsSlice)['selectNotifications']>)
    useAppDispatchSpy.mockReturnValue(dispatchMock)
    useNotificationsTokenVersionSpy.mockReturnValue(notificationsTokenVersionMock)
    useIsNotificationsRenewalEnabledSpy.mockReturnValue(true)
  })

  it('if the Notifications Renewal feature flag is disabled, should return the correct values', () => {
    useIsNotificationsRenewalEnabledSpy.mockReturnValue(false)

    const { result } = renderHook(() => useNotificationsRenewal())

    expect(result.current.safesForRenewal).toBeUndefined()
    expect(result.current.numberChainsForRenewal).toBe(0)
    expect(result.current.numberSafesForRenewal).toBe(0)
    expect(result.current.renewNotifications).toBeInstanceOf(Function)
    expect(result.current.needsRenewal).toBe(false)

    expect(useSafeInfoSpy).toHaveBeenCalledTimes(1)
    expect(useNotificationRegistrationsSpy).toHaveBeenCalledTimes(1)
    expect(useNotificationPreferencesSpy).toHaveBeenCalledTimes(1)
    expect(useNotificationsTokenVersionSpy).toHaveBeenCalledTimes(1)
    expect(useIsNotificationsRenewalEnabledSpy).toHaveBeenCalledTimes(1)

    expect(getAllPreferencesMock).not.toHaveBeenCalled()
    expect(getChainPreferencesMock).not.toHaveBeenCalled()

    expect(registerNotificationsMock).not.toHaveBeenCalled()
    expect(registerNotificationsMock).not.toHaveBeenCalled()
  })

  describe('if a Safe is loaded', () => {
    it('should return the correct values for the loaded Safe`s chain', () => {
      const { result } = renderHook(() => useNotificationsRenewal())

      expect(result.current.safesForRenewal).toStrictEqual({ [chainId1]: [safeAddress1, safeAddress3] })
      expect(result.current.numberChainsForRenewal).toBe(1)
      expect(result.current.numberSafesForRenewal).toBe(2)
      expect(result.current.renewNotifications).toBeInstanceOf(Function)
      expect(result.current.needsRenewal).toBe(true)

      expect(getAllPreferencesMock).not.toHaveBeenCalled()
      expect(getChainPreferencesMock).toHaveBeenCalledTimes(1)
      expect(getChainPreferencesMock).toHaveBeenCalledWith(chainId1)
    })

    it('should return correct values if no Safe for the current chain needs renewal', () => {
      useNotificationsTokenVersionSpy.mockReturnValue({
        safeTokenVersion: V2,
        allTokenVersions: { [chainId1]: { [safeAddress1]: V2, [safeAddress2]: V2, [safeAddress3]: V2 } },
        setTokenVersion: jest.fn(),
      })

      const { result } = renderHook(() => useNotificationsRenewal())

      expect(result.current.safesForRenewal).toBeUndefined()
      expect(result.current.numberChainsForRenewal).toBe(0)
      expect(result.current.numberSafesForRenewal).toBe(0)
      expect(result.current.renewNotifications).toBeInstanceOf(Function)
      expect(result.current.needsRenewal).toBe(false)

      expect(getAllPreferencesMock).not.toHaveBeenCalled()
      expect(getChainPreferencesMock).toHaveBeenCalledTimes(1)
      expect(getChainPreferencesMock).toHaveBeenCalledWith(chainId1)
    })

    it('should return correct values if current Safe is already renewed and no other Safe on current chain has notifications enabled', () => {
      useNotificationsTokenVersionSpy.mockReturnValue({
        safeTokenVersion: V2,
        allTokenVersions: { [chainId1]: { [safeAddress1]: V2 } },
        setTokenVersion: jest.fn(),
      })

      getChainPreferencesMock.mockReturnValue([preferencesMock[`${chainId1}:${safeAddress1}`]])

      const { result } = renderHook(() => useNotificationsRenewal())

      expect(result.current.safesForRenewal).toBeUndefined()
      expect(result.current.numberChainsForRenewal).toBe(0)
      expect(result.current.numberSafesForRenewal).toBe(0)
      expect(result.current.renewNotifications).toBeInstanceOf(Function)
      expect(result.current.needsRenewal).toBe(false)

      expect(getAllPreferencesMock).not.toHaveBeenCalled()
      expect(getChainPreferencesMock).toHaveBeenCalledTimes(1)
      expect(getChainPreferencesMock).toHaveBeenCalledWith(chainId1)
    })
  })

  describe('if NO Safe is loaded', () => {
    beforeEach(() => {
      useSafeInfoSpy.mockReturnValue({
        safe: {
          chainId: undefined,
          address: { value: undefined },
        },
        safeLoaded: false,
      } as unknown as ReturnType<typeof useSafeInfoHook.default>)
    })

    it('should return the correct values for all the Safes with preferences', () => {
      const { result } = renderHook(() => useNotificationsRenewal())

      expect(result.current.safesForRenewal).toStrictEqual({
        [chainId1]: [safeAddress1, safeAddress3],
        [chainId2]: [safeAddress1],
      })
      expect(result.current.numberChainsForRenewal).toBe(2)
      expect(result.current.numberSafesForRenewal).toBe(3)
      expect(result.current.renewNotifications).toBeInstanceOf(Function)
      expect(result.current.needsRenewal).toBe(true)

      expect(getChainPreferencesMock).not.toHaveBeenCalled()
      expect(getAllPreferencesMock).toHaveBeenCalledTimes(1)
    })

    it('should return correct values if no notification preferences are stored', () => {
      getAllPreferencesMock.mockReturnValue(undefined)

      const { result } = renderHook(() => useNotificationsRenewal())

      expect(result.current.safesForRenewal).toBeUndefined()
      expect(result.current.numberChainsForRenewal).toBe(0)
      expect(result.current.numberSafesForRenewal).toBe(0)
      expect(result.current.renewNotifications).toBeInstanceOf(Function)
      expect(result.current.needsRenewal).toBe(false)

      expect(getChainPreferencesMock).not.toHaveBeenCalled()
      expect(getAllPreferencesMock).toHaveBeenCalledTimes(1)
    })

    it('should return correct values if no Safe needs renewal', () => {
      useNotificationsTokenVersionSpy.mockReturnValue({
        safeTokenVersion: V2,
        allTokenVersions: {
          [chainId1]: { [safeAddress1]: V2, [safeAddress2]: V2, [safeAddress3]: V2 },
          [chainId2]: { [safeAddress1]: V2 },
        },
        setTokenVersion: jest.fn(),
      })

      const { result } = renderHook(() => useNotificationsRenewal())

      expect(result.current.safesForRenewal).toBeUndefined()
      expect(result.current.numberChainsForRenewal).toBe(0)
      expect(result.current.numberSafesForRenewal).toBe(0)
      expect(result.current.renewNotifications).toBeInstanceOf(Function)
      expect(result.current.needsRenewal).toBe(false)

      expect(getChainPreferencesMock).not.toHaveBeenCalled()
      expect(getAllPreferencesMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('renewNotifications', () => {
    it('should call `registerNotifications` with the Safes that need to be renewed', async () => {
      const { result } = renderHook(() => useNotificationsRenewal())

      await result.current.renewNotifications()

      expect(registerNotificationsMock).toHaveBeenCalledTimes(1)
      expect(registerNotificationsMock).toHaveBeenCalledWith(result.current.safesForRenewal)
    })

    it('should show an error notification if `registerNotifications` call throws', async () => {
      const notificationMock = {
        message: 'Something went wrong',
        groupKey: RENEWAL_NOTIFICATION_KEY,
      }
      showNotificationSpy.mockReturnValue(
        notificationMock as unknown as ReturnType<(typeof notificationsSlice)['showNotification']>,
      )
      registerNotificationsMock.mockRejectedValueOnce(new Error('Failed to renew notifications'))

      const { result } = renderHook(() => useNotificationsRenewal())

      await result.current.renewNotifications()

      expect(registerNotificationsMock).toHaveBeenCalledTimes(1)
      expect(registerNotificationsMock).toHaveBeenCalledWith(result.current.safesForRenewal)

      await waitFor(async () => {
        expect(dispatchMock).toHaveBeenCalledTimes(1)
        expect(dispatchMock).toHaveBeenCalledWith(notificationMock)

        expect(showNotificationSpy).toHaveBeenCalledTimes(1)
        expect(showNotificationSpy).toHaveBeenCalledWith({
          message: 'Failed to renew notifications',
          variant: 'error',
          detailedMessage: 'Failed to renew notifications',
          groupKey: RENEWAL_NOTIFICATION_KEY,
        })
      })
    })

    it('should NOT call `registerNotifications` if no Safes need to be renewed', async () => {
      getChainPreferencesMock.mockReturnValue([])

      const { result } = renderHook(() => useNotificationsRenewal())

      await result.current.renewNotifications()

      expect(registerNotificationsMock).not.toHaveBeenCalled()
    })
  })
})
