import { toBeHex } from 'ethers'
import { useShowNotificationsRenewalMessage } from '../useShowNotificationsRenewalMessage'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useWalletHook from '@/hooks/wallets/useWallet'
import * as store from '@/store'
import * as useNotificationsTokenVersion from '../useNotificationsTokenVersion'
import * as useNotificationPreferences from '../useNotificationPreferences'
import * as useNotificationsRenewal from '../useNotificationsRenewal'
import * as notificationsSlice from '@/store/notificationsSlice'
import * as useIsWrongChain from '@/hooks/useIsWrongChain'
import { NotificationsTokenVersion } from '@/services/push-notifications/preferences'
import { renderHook, waitFor } from '@testing-library/react'
import { RENEWAL_MESSAGE, RENEWAL_NOTIFICATION_KEY } from '@views/components/settings/PushNotifications/constants'

const { V1, V2 } = NotificationsTokenVersion

describe('useShowNotificationsRenewalMessage', () => {
  const chainId = '123'

  const safeAddress1 = toBeHex('0x1', 20)
  const safeAddress2 = toBeHex('0x2', 20)
  const safeAddress3 = toBeHex('0x3', 20)

  const useSafeInfoSpy = jest.spyOn(useSafeInfoHook, 'default')
  const useWalletSpy = jest.spyOn(useWalletHook, 'default')
  const useAppDispatchSpy = jest.spyOn(store, 'useAppDispatch')
  const useAppSelectorSpy = jest.spyOn(store, 'useAppSelector')
  const useNotificationsTokenVersionSpy = jest.spyOn(useNotificationsTokenVersion, 'useNotificationsTokenVersion')
  const useNotificationPreferencesSpy = jest.spyOn(useNotificationPreferences, 'useNotificationPreferences')
  const useNotificationsRenewalSpy = jest.spyOn(useNotificationsRenewal, 'useNotificationsRenewal')
  const useIsNotificationsRenewalEnabledSpy = jest.spyOn(
    useNotificationsTokenVersion,
    'useIsNotificationsRenewalEnabled',
  )
  const useIsWrongChainSpy = jest.spyOn(useIsWrongChain, 'default')
  const showNotificationSpy = jest.spyOn(notificationsSlice, 'showNotification')
  const selectNotificationsSpy = jest.spyOn(notificationsSlice, 'selectNotifications')

  const dispatchMock = jest.fn()
  const renewNotificationsMock = jest.fn()
  const safePreferencesMock = useNotificationPreferences.DEFAULT_NOTIFICATION_PREFERENCES
  const getPreferencesMock = jest.fn().mockReturnValue(safePreferencesMock)

  const notificationMock = {
    message: 'Sign this message to renew your notifications',
    groupKey: `${RENEWAL_NOTIFICATION_KEY}-${chainId}-${safeAddress1}`,
  }
  const notificationsMock = [{ message: 'Hello world', groupKey: 'helloWorld' }]
  const notificationsTokenVersionMock = {
    safeTokenVersion: undefined,
    allTokenVersions: { [chainId]: { [safeAddress2]: V2, [safeAddress3]: V1 } },
    setTokenVersion: jest.fn(),
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    useSafeInfoSpy.mockReturnValue({
      safe: {
        chainId,
        address: { value: safeAddress1 },
      },
      safeLoaded: true,
    } as unknown as ReturnType<typeof useSafeInfoHook.default>)

    useNotificationPreferencesSpy.mockReturnValue({
      getPreferences: getPreferencesMock,
    } as unknown as ReturnType<(typeof useNotificationPreferences)['useNotificationPreferences']>)

    useNotificationsRenewalSpy.mockReturnValue({
      renewNotifications: renewNotificationsMock,
    } as unknown as ReturnType<(typeof useNotificationsRenewal)['useNotificationsRenewal']>)

    selectNotificationsSpy.mockReturnValue({} as ReturnType<(typeof notificationsSlice)['selectNotifications']>)
    useWalletSpy.mockReturnValue({} as ReturnType<typeof useWalletHook.default>)
    useAppDispatchSpy.mockReturnValue(dispatchMock)
    useAppSelectorSpy.mockReturnValue(notificationsMock)
    useNotificationsTokenVersionSpy.mockReturnValue(notificationsTokenVersionMock)
    useIsWrongChainSpy.mockReturnValue(false)
    useIsNotificationsRenewalEnabledSpy.mockReturnValue(true)
  })

  it('should show the renewal notification if needed + set the token version to V1', async () => {
    renderHook(() => useShowNotificationsRenewalMessage())

    expect(useSafeInfoSpy).toHaveBeenCalledTimes(1)
    expect(useNotificationPreferencesSpy).toHaveBeenCalledTimes(1)
    expect(getPreferencesMock).toHaveBeenCalledTimes(1)
    expect(getPreferencesMock).toHaveBeenCalledWith(chainId, safeAddress1)
    expect(useWalletSpy).toHaveBeenCalledTimes(1)
    expect(useAppDispatchSpy).toHaveBeenCalledTimes(1)
    expect(useIsWrongChainSpy).toHaveBeenCalledTimes(1)
    expect(useIsNotificationsRenewalEnabledSpy).toHaveBeenCalledTimes(1)
    expect(useAppSelectorSpy).toHaveBeenCalledTimes(1)
    expect(useAppSelectorSpy).toHaveBeenCalledWith(notificationsSlice.selectNotifications)
    expect(useNotificationsTokenVersionSpy).toHaveBeenCalledTimes(1)
    expect(useNotificationsRenewalSpy).toHaveBeenCalledTimes(1)

    await waitFor(async () => {
      expect(showNotificationSpy).toHaveBeenCalledTimes(1)
      expect(showNotificationSpy).toHaveBeenCalledWith({
        message: RENEWAL_MESSAGE,
        variant: 'warning',
        groupKey: `${RENEWAL_NOTIFICATION_KEY}-${chainId}-${safeAddress1}`,
        link: {
          onClick: expect.any(Function),
          title: 'Sign',
        },
      })

      expect(dispatchMock).toHaveBeenCalledTimes(1)

      expect(notificationsTokenVersionMock.setTokenVersion).toHaveBeenCalledTimes(1)
      expect(notificationsTokenVersionMock.setTokenVersion).toHaveBeenCalledWith(V1)
    })
  })

  it('should call the `renewNotifications` function if the message link is clicked', async () => {
    const simulateLinkClick = ({ link }: Parameters<(typeof notificationsSlice)['showNotification']>[0]) => {
      if (link && 'onClick' in link) {
        link.onClick()
      }
    }

    renderHook(() => useShowNotificationsRenewalMessage())

    await waitFor(async () => {
      expect(showNotificationSpy).toHaveBeenCalledTimes(1)
      expect(dispatchMock).toHaveBeenCalledTimes(1)
      expect(renewNotificationsMock).not.toHaveBeenCalled()
    })

    simulateLinkClick(showNotificationSpy.mock.calls[0][0])

    expect(renewNotificationsMock).toHaveBeenCalledTimes(1)
  })

  describe('should NOT show the renewal notification', () => {
    const expectToNotShowNotification = async (
      renderHookFn: () => ReturnType<typeof useShowNotificationsRenewalMessage>,
    ) => {
      renderHook(renderHookFn)

      await waitFor(async () => {
        expect(showNotificationSpy).not.toHaveBeenCalled()
        expect(dispatchMock).not.toHaveBeenCalled()
        expect(notificationsTokenVersionMock.setTokenVersion).not.toHaveBeenCalled()
        expect(renewNotificationsMock).not.toHaveBeenCalled()
      })
    }

    it('if no signer is connected', async () => {
      useWalletSpy.mockReturnValueOnce(null)
      await expectToNotShowNotification(() => useShowNotificationsRenewalMessage())
    })

    it('if there are no preferences for the Safe', async () => {
      getPreferencesMock.mockReturnValueOnce(null)
      await expectToNotShowNotification(() => useShowNotificationsRenewalMessage())
    })

    it('if no Safe is loaded', async () => {
      useSafeInfoSpy.mockReturnValueOnce({
        safe: {
          chainId: undefined,
          address: { value: undefined },
        },
        safeLoaded: false,
      } as unknown as ReturnType<typeof useSafeInfoHook.default>)
      await expectToNotShowNotification(() => useShowNotificationsRenewalMessage())
    })

    it('if the user is on the wrong chain', async () => {
      useIsWrongChainSpy.mockReturnValueOnce(true)
      await expectToNotShowNotification(() => useShowNotificationsRenewalMessage())
    })

    it('if the Safe`s token version is set', async () => {
      useNotificationsTokenVersionSpy.mockReturnValueOnce({ ...notificationsTokenVersionMock, safeTokenVersion: V1 })
      await expectToNotShowNotification(() => useShowNotificationsRenewalMessage())
    })

    it('if there already is a notification message', async () => {
      useAppSelectorSpy.mockReturnValueOnce([notificationMock])
      await expectToNotShowNotification(() => useShowNotificationsRenewalMessage())
    })

    it('if notifications renewal feature is not enabled', async () => {
      useIsNotificationsRenewalEnabledSpy.mockReturnValueOnce(false)
      await expectToNotShowNotification(() => useShowNotificationsRenewalMessage())
    })
  })
})
