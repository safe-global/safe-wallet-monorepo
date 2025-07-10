import { toBeHex, BrowserProvider } from 'ethers'
import { DeviceType } from '@safe-global/safe-gateway-typescript-sdk/dist/types/notifications'
import * as sdk from '@safe-global/safe-gateway-typescript-sdk'

import { renderHook } from '@/tests/test-utils'
import { useNotificationRegistrations } from '../useNotificationRegistrations'
import * as web3 from '@/hooks/wallets/web3'
import * as wallet from '@/hooks/wallets/useWallet'
import * as logic from '../../logic'
import * as preferences from '../useNotificationPreferences'
import * as tokenVersion from '../useNotificationsTokenVersion'
import * as notificationsSlice from '@/store/notificationsSlice'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { MockEip1193Provider } from '@/tests/mocks/providers'
import { NotificationsTokenVersion } from '@/services/push-notifications/preferences'

jest.mock('@safe-global/safe-gateway-typescript-sdk')

jest.mock('../useNotificationPreferences')
jest.mock('../useNotificationsTokenVersion')

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(),
  },
})

describe('useNotificationRegistrations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('registerNotifications', () => {
    const setTokenVersionMock = jest.fn()

    beforeEach(() => {
      const mockProvider = new BrowserProvider(MockEip1193Provider)
      jest.spyOn(web3, 'createWeb3').mockImplementation(() => mockProvider)
      jest
        .spyOn(tokenVersion, 'useNotificationsTokenVersion')
        .mockImplementation(
          () =>
            ({ setTokenVersion: setTokenVersionMock }) as unknown as ReturnType<
              typeof tokenVersion.useNotificationsTokenVersion
            >,
        )
      jest.spyOn(wallet, 'default').mockImplementation(
        () =>
          ({
            label: 'MetaMask',
          }) as ConnectedWallet,
      )
    })

    const registerDeviceSpy = jest.spyOn(sdk, 'registerDevice')

    const getExampleRegisterDevicePayload = (
      safesToRegister: logic.NotifiableSafes,
    ): logic.NotificationRegistration => {
      const safeRegistrations = Object.entries(safesToRegister).reduce<
        logic.NotificationRegistration['safeRegistrations']
      >((acc, [chainId, safeAddresses]) => {
        const safeRegistration: logic.NotificationRegistration['safeRegistrations'][number] = {
          chainId,
          safes: safeAddresses,
          signatures: [toBeHex('0x69420', 65)],
        }

        acc.push(safeRegistration)

        return acc
      }, [])

      return {
        uuid: self.crypto.randomUUID(),
        cloudMessagingToken: 'token',
        buildNumber: '0',
        bundle: 'https://app.safe.global',
        deviceType: DeviceType.WEB,
        version: '1.17.0',
        timestamp: Math.floor(new Date().getTime() / 1000).toString(),
        safeRegistrations,
      }
    }

    it('does not register if no uuid is present', async () => {
      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: undefined,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.registerNotifications({})

      expect(registerDeviceSpy).not.toHaveBeenCalled()
      expect(setTokenVersionMock).not.toHaveBeenCalled()
    })

    it('does not create preferences/notify if registration does not succeed', async () => {
      const safesToRegister: logic.NotifiableSafes = {
        '1': [toBeHex('0x1', 20)],
        '2': [toBeHex('0x2', 20)],
      }

      const payload = getExampleRegisterDevicePayload(safesToRegister)

      jest.spyOn(logic, 'getRegisterDevicePayload').mockImplementation(() => Promise.resolve(payload))

      // @ts-expect-error
      registerDeviceSpy.mockImplementation(() => Promise.resolve('Registration could not be completed.'))

      const createPreferencesMock = jest.fn()

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: self.crypto.randomUUID(),
            createPreferences: createPreferencesMock,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.registerNotifications(safesToRegister)

      expect(registerDeviceSpy).toHaveBeenCalledWith(payload)

      expect(createPreferencesMock).not.toHaveBeenCalled()
      expect(setTokenVersionMock).not.toHaveBeenCalled()
    })

    it('does not create preferences/notify if registration throws', async () => {
      const safesToRegister: logic.NotifiableSafes = {
        '1': [toBeHex('0x1', 20)],
        '2': [toBeHex('0x2', 20)],
      }

      const payload = getExampleRegisterDevicePayload(safesToRegister)

      jest.spyOn(logic, 'getRegisterDevicePayload').mockImplementation(() => Promise.resolve(payload))

      // @ts-expect-error
      registerDeviceSpy.mockImplementation(() => Promise.resolve('Registration could not be completed.'))

      const createPreferencesMock = jest.fn()

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: self.crypto.randomUUID(),
            createPreferences: createPreferencesMock,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.registerNotifications(safesToRegister)

      expect(registerDeviceSpy).toHaveBeenCalledWith(payload)

      expect(createPreferencesMock).not.toHaveBeenCalledWith()
      expect(setTokenVersionMock).not.toHaveBeenCalledWith()
    })

    it('creates preferences/notifies if registration succeeded', async () => {
      const safesToRegister: logic.NotifiableSafes = {
        '1': [toBeHex('0x1', 20)],
        '2': [toBeHex('0x2', 20)],
      }

      const payload = getExampleRegisterDevicePayload(safesToRegister)

      jest.spyOn(logic, 'getRegisterDevicePayload').mockImplementation(() => Promise.resolve(payload))

      registerDeviceSpy.mockImplementation(() => Promise.resolve())

      const createPreferencesMock = jest.fn()

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: self.crypto.randomUUID(),
            createPreferences: createPreferencesMock,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const showNotificationSpy = jest.spyOn(notificationsSlice, 'showNotification')

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.registerNotifications(safesToRegister, true)

      expect(registerDeviceSpy).toHaveBeenCalledWith(payload)

      expect(createPreferencesMock).toHaveBeenCalled()

      expect(setTokenVersionMock).toHaveBeenCalledTimes(1)
      expect(setTokenVersionMock).toHaveBeenCalledWith(NotificationsTokenVersion.V2, safesToRegister)

      expect(showNotificationSpy).toHaveBeenCalledWith({
        groupKey: 'notifications',
        message: 'You will now receive notifications for these Safe Accounts in your browser.',
        variant: 'success',
      })
    })
  })

  describe('unregisterSafeNotifications', () => {
    const unregisterSafeSpy = jest.spyOn(sdk, 'unregisterSafe')

    it('does not unregister if no uuid is present', async () => {
      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: undefined,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.unregisterSafeNotifications('1', toBeHex('0x1', 20))

      expect(unregisterSafeSpy).not.toHaveBeenCalled()
    })

    it('does not delete preferences if unregistration does not succeed', async () => {
      // @ts-expect-error
      unregisterSafeSpy.mockImplementation(() => Promise.resolve('Unregistration could not be completed.'))

      const uuid = self.crypto.randomUUID()
      const deletePreferencesMock = jest.fn()

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid,
            deletePreferences: deletePreferencesMock,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      const chainId = '1'
      const safeAddress = toBeHex('0x1', 20)

      await result.current.unregisterSafeNotifications(chainId, safeAddress)

      expect(unregisterSafeSpy).toHaveBeenCalledWith(chainId, safeAddress, uuid)

      expect(deletePreferencesMock).not.toHaveBeenCalled()
    })

    it('does not delete preferences if unregistration throws', async () => {
      unregisterSafeSpy.mockImplementation(() => Promise.reject())

      const uuid = self.crypto.randomUUID()
      const deletePreferencesMock = jest.fn()

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid,
            deletePreferences: deletePreferencesMock,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      const chainId = '1'
      const safeAddress = toBeHex('0x1', 20)

      await result.current.unregisterSafeNotifications(chainId, safeAddress)

      expect(unregisterSafeSpy).toHaveBeenCalledWith(chainId, safeAddress, uuid)

      expect(deletePreferencesMock).not.toHaveBeenCalled()
    })

    it('deletes preferences if unregistration succeeds', async () => {
      unregisterSafeSpy.mockImplementation(() => Promise.resolve())

      const uuid = self.crypto.randomUUID()
      const deletePreferencesMock = jest.fn()

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid,
            deletePreferences: deletePreferencesMock,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      const chainId = '1'
      const safeAddress = toBeHex('0x1', 20)

      await result.current.unregisterSafeNotifications(chainId, safeAddress)

      expect(unregisterSafeSpy).toHaveBeenCalledWith(chainId, safeAddress, uuid)

      expect(deletePreferencesMock).toHaveBeenCalledWith({ [chainId]: [safeAddress] })
    })
  })

  describe('unregisterDeviceNotifications', () => {
    const unregisterDeviceSpy = jest.spyOn(sdk, 'unregisterDevice')

    it('does not unregister device if no uuid is present', async () => {
      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: undefined,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.unregisterDeviceNotifications('1')

      expect(unregisterDeviceSpy).not.toHaveBeenCalled()
    })

    it('does not clear preferences if unregistration does not succeed', async () => {
      // @ts-expect-error
      unregisterDeviceSpy.mockImplementation(() => Promise.resolve('Unregistration could not be completed.'))

      const uuid = self.crypto.randomUUID()
      const deleteAllChainPreferencesMock = jest.fn()

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid,
            deleteAllChainPreferences: deleteAllChainPreferencesMock,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.unregisterDeviceNotifications('1')

      expect(unregisterDeviceSpy).toHaveBeenCalledWith('1', uuid)

      expect(deleteAllChainPreferencesMock).not.toHaveBeenCalled()
    })

    it('does not clear preferences if unregistration throws', async () => {
      unregisterDeviceSpy.mockImplementation(() => Promise.reject())

      const uuid = self.crypto.randomUUID()
      const deleteAllChainPreferencesMock = jest.fn()

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid,
            deleteAllChainPreferences: deleteAllChainPreferencesMock,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.unregisterDeviceNotifications('1')

      expect(unregisterDeviceSpy).toHaveBeenCalledWith('1', uuid)

      expect(deleteAllChainPreferencesMock).not.toHaveBeenCalledWith()
    })

    it('clears chain preferences if unregistration succeeds', async () => {
      unregisterDeviceSpy.mockImplementation(() => Promise.resolve())

      const uuid = self.crypto.randomUUID()
      const deleteAllChainPreferencesMock = jest.fn()

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid,
            deleteAllChainPreferences: deleteAllChainPreferencesMock,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.unregisterDeviceNotifications('1')

      expect(unregisterDeviceSpy).toHaveBeenCalledWith('1', uuid)

      expect(deleteAllChainPreferencesMock).toHaveBeenCalledWith('1')
    })
  })
})
