import { toBeHex, BrowserProvider } from 'ethers'
import { http, HttpResponse } from 'msw'

import { renderHook } from '@/tests/test-utils'
import { useNotificationRegistrations } from '../useNotificationRegistrations'
import * as web3 from '@/hooks/wallets/web3'
import * as wallet from '@/hooks/wallets/useWallet'
import * as logic from '../../logic'
import {
  DISABLE_FAILED_MESSAGE,
  ENABLE_FAILED_MESSAGE,
  PERMISSION_BLOCKED_MESSAGE,
  PERMISSION_REQUIRED_MESSAGE,
  RETRY_MESSAGE,
  SIGNATURE_REJECTED_MESSAGE,
} from '../../constants'
import { getGenericErrorWithStatus, RTK_QUERY_ERROR_MESSAGES } from '@/utils/rtkQuery'
import * as preferences from '../useNotificationPreferences'
import * as tokenVersion from '../useNotificationsTokenVersion'
import * as notificationsSlice from '@/store/notificationsSlice'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { MockEip1193Provider } from '@/tests/mocks/providers'
import { NotificationsTokenVersion } from '@/services/push-notifications/preferences'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'

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

  afterEach(() => {
    delete (globalThis as { Notification?: unknown }).Notification
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
      jest.spyOn(logic, 'requestNotificationPermission').mockResolvedValue(true)
    })

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
        deviceType: 'WEB',
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

      const registered = await result.current.registerNotifications({})

      expect(registered).toBe(false)
      expect(setTokenVersionMock).not.toHaveBeenCalled()
    })

    it('does not register and shows an error if permission is not granted', async () => {
      jest.spyOn(logic, 'requestNotificationPermission').mockResolvedValue(false)
      const getRegisterDevicePayloadSpy = jest.spyOn(logic, 'getRegisterDevicePayload')
      const showNotificationSpy = jest.spyOn(notificationsSlice, 'showNotification')

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: self.crypto.randomUUID(),
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      const registered = await result.current.registerNotifications({ '1': [toBeHex('0x1', 20)] })

      expect(registered).toBe(false)
      expect(getRegisterDevicePayloadSpy).not.toHaveBeenCalled()
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: PERMISSION_REQUIRED_MESSAGE,
          variant: 'error',
          groupKey: 'notifications-error',
        }),
      )
    })

    it('shows the blocked message if permission is denied', async () => {
      jest.spyOn(logic, 'requestNotificationPermission').mockResolvedValue(false)
      const showNotificationSpy = jest.spyOn(notificationsSlice, 'showNotification')

      globalThis.Notification = { permission: 'denied' } as unknown as jest.Mocked<typeof Notification>
      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: self.crypto.randomUUID(),
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      const registered = await result.current.registerNotifications({ '1': [toBeHex('0x1', 20)] })

      expect(registered).toBe(false)
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: PERMISSION_BLOCKED_MESSAGE,
          variant: 'error',
          groupKey: 'notifications-error',
        }),
      )
    })

    it('does not create preferences/notify if registration does not succeed', async () => {
      const safesToRegister: logic.NotifiableSafes = {
        '1': [toBeHex('0x1', 20)],
        '2': [toBeHex('0x2', 20)],
      }

      const payload = getExampleRegisterDevicePayload(safesToRegister)

      jest.spyOn(logic, 'getRegisterDevicePayload').mockImplementation(() => Promise.resolve(payload))

      // Mock the registration endpoint to return an error
      server.use(
        http.post(`${GATEWAY_URL}/v1/register/notifications`, () => {
          return HttpResponse.json({ error: 'Registration could not be completed.' })
        }),
      )

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

      await result.current.registerNotifications(safesToRegister)

      expect(createPreferencesMock).not.toHaveBeenCalled()
      expect(setTokenVersionMock).not.toHaveBeenCalled()
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `${ENABLE_FAILED_MESSAGE} ${RETRY_MESSAGE}`,
          variant: 'error',
          groupKey: 'notifications-error',
        }),
      )
    })

    it('does not create preferences/notify if the request fails at transport level', async () => {
      const safesToRegister: logic.NotifiableSafes = {
        '1': [toBeHex('0x1', 20)],
        '2': [toBeHex('0x2', 20)],
      }

      const payload = getExampleRegisterDevicePayload(safesToRegister)

      jest.spyOn(logic, 'getRegisterDevicePayload').mockImplementation(() => Promise.resolve(payload))

      // Mock the registration endpoint to throw an error
      server.use(
        http.post(`${GATEWAY_URL}/v1/register/notifications`, () => {
          return HttpResponse.error()
        }),
      )

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

      const registered = await result.current.registerNotifications(safesToRegister)

      expect(registered).toBe(false)
      expect(createPreferencesMock).not.toHaveBeenCalled()
      expect(setTokenVersionMock).not.toHaveBeenCalled()
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `${ENABLE_FAILED_MESSAGE} ${RTK_QUERY_ERROR_MESSAGES.network}`,
          variant: 'error',
          groupKey: 'notifications-error',
        }),
      )
    })

    it('surfaces the reason returned by the gateway', async () => {
      const safesToRegister: logic.NotifiableSafes = { '1': [toBeHex('0x1', 20)] }
      const payload = getExampleRegisterDevicePayload(safesToRegister)

      jest.spyOn(logic, 'getRegisterDevicePayload').mockImplementation(() => Promise.resolve(payload))

      server.use(
        http.post(`${GATEWAY_URL}/v1/register/notifications`, () => {
          return HttpResponse.json({ message: 'Invalid signature for safe 0x1' }, { status: 422 })
        }),
      )

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

      const registered = await result.current.registerNotifications(safesToRegister)

      expect(registered).toBe(false)
      expect(createPreferencesMock).not.toHaveBeenCalled()
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `${ENABLE_FAILED_MESSAGE} Invalid signature for safe 0x1`,
          variant: 'error',
          groupKey: 'notifications-error',
        }),
      )
    })

    it('keeps the status visible if the gateway gives no reason', async () => {
      const safesToRegister: logic.NotifiableSafes = { '1': [toBeHex('0x1', 20)] }
      const payload = getExampleRegisterDevicePayload(safesToRegister)

      jest.spyOn(logic, 'getRegisterDevicePayload').mockImplementation(() => Promise.resolve(payload))

      server.use(
        http.post(`${GATEWAY_URL}/v1/register/notifications`, () => {
          return HttpResponse.json({}, { status: 500 })
        }),
      )
      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: self.crypto.randomUUID(),
            createPreferences: jest.fn(),
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const showNotificationSpy = jest.spyOn(notificationsSlice, 'showNotification')

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.registerNotifications(safesToRegister)

      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `${ENABLE_FAILED_MESSAGE} ${getGenericErrorWithStatus(500)}`,
          variant: 'error',
          groupKey: 'notifications-error',
        }),
      )
    })

    it('shows a rejection message if the user rejects the signature request', async () => {
      const safesToRegister: logic.NotifiableSafes = {
        '1': [toBeHex('0x1', 20)],
      }

      const rejectionError = Object.assign(new Error('user rejected action'), { code: 'ACTION_REJECTED' })
      jest.spyOn(logic, 'getRegisterDevicePayload').mockImplementation(() => Promise.reject(rejectionError))

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

      const registered = await result.current.registerNotifications(safesToRegister)

      expect(registered).toBe(false)
      expect(createPreferencesMock).not.toHaveBeenCalled()
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: SIGNATURE_REJECTED_MESSAGE,
          variant: 'error',
          groupKey: 'notifications-error',
        }),
      )
    })

    it('creates preferences/notifies if registration succeeded', async () => {
      const safesToRegister: logic.NotifiableSafes = {
        '1': [toBeHex('0x1', 20)],
        '2': [toBeHex('0x2', 20)],
      }

      const payload = getExampleRegisterDevicePayload(safesToRegister)

      jest.spyOn(logic, 'getRegisterDevicePayload').mockImplementation(() => Promise.resolve(payload))

      // Default MSW handler returns success
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

      await result.current.registerNotifications(safesToRegister)

      expect(createPreferencesMock).toHaveBeenCalled()

      expect(setTokenVersionMock).toHaveBeenCalledTimes(1)
      expect(setTokenVersionMock).toHaveBeenCalledWith(NotificationsTokenVersion.V2, safesToRegister)

      expect(showNotificationSpy).toHaveBeenCalledWith({
        groupKey: 'notifications',
        message: 'You will now receive notifications for these Safe accounts in your browser.',
        variant: 'success',
      })
    })
  })

  describe('unregisterSafeNotifications', () => {
    it('does not unregister if no uuid is present', async () => {
      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: undefined,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.unregisterSafeNotifications('1', toBeHex('0x1', 20))
    })

    it('does not delete preferences if unregistration does not succeed', async () => {
      // Mock the endpoint to return an error
      server.use(
        http.delete(`${GATEWAY_URL}/v1/chains/:chainId/notifications/devices/:uuid/safes/:safeAddress`, () => {
          return HttpResponse.json({ error: 'Unregistration could not be completed.' })
        }),
      )

      const uuid = self.crypto.randomUUID()
      const deletePreferencesMock = jest.fn()

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid,
            deletePreferences: deletePreferencesMock,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const showNotificationSpy = jest.spyOn(notificationsSlice, 'showNotification')

      const { result } = renderHook(() => useNotificationRegistrations())

      const chainId = '1'
      const safeAddress = toBeHex('0x1', 20)

      await result.current.unregisterSafeNotifications(chainId, safeAddress)

      expect(deletePreferencesMock).not.toHaveBeenCalled()
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `${DISABLE_FAILED_MESSAGE} ${RETRY_MESSAGE}`,
          variant: 'error',
          groupKey: 'notifications-error',
        }),
      )
    })

    it('surfaces the reason returned by the gateway', async () => {
      server.use(
        http.delete(`${GATEWAY_URL}/v1/chains/:chainId/notifications/devices/:uuid/safes/:safeAddress`, () => {
          return HttpResponse.json({ message: 'Device not found' }, { status: 404 })
        }),
      )

      const deletePreferencesMock = jest.fn()

      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: self.crypto.randomUUID(),
            deletePreferences: deletePreferencesMock,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const showNotificationSpy = jest.spyOn(notificationsSlice, 'showNotification')

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.unregisterSafeNotifications('1', toBeHex('0x1', 20))

      expect(deletePreferencesMock).not.toHaveBeenCalled()
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `${DISABLE_FAILED_MESSAGE} Device not found`,
          variant: 'error',
          groupKey: 'notifications-error',
        }),
      )
    })

    it('does not delete preferences if the request fails at transport level', async () => {
      // Mock the endpoint to throw an error
      server.use(
        http.delete(`${GATEWAY_URL}/v1/chains/:chainId/notifications/devices/:uuid/safes/:safeAddress`, () => {
          return HttpResponse.error()
        }),
      )

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

      expect(deletePreferencesMock).not.toHaveBeenCalled()
    })

    it('deletes preferences if unregistration succeeds', async () => {
      // Default MSW handler returns success
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

      expect(deletePreferencesMock).toHaveBeenCalledWith({ [chainId]: [safeAddress] })
    })
  })

  describe('unregisterDeviceNotifications', () => {
    it('does not unregister device if no uuid is present', async () => {
      ;(preferences.useNotificationPreferences as jest.Mock).mockImplementation(
        () =>
          ({
            uuid: undefined,
          }) as unknown as ReturnType<typeof preferences.useNotificationPreferences>,
      )

      const { result } = renderHook(() => useNotificationRegistrations())

      await result.current.unregisterDeviceNotifications('1')
    })

    it('does not clear preferences if unregistration does not succeed', async () => {
      // Mock the endpoint to return an error
      server.use(
        http.delete(`${GATEWAY_URL}/v1/chains/:chainId/notifications/devices/:uuid`, () => {
          return HttpResponse.json({ error: 'Unregistration could not be completed.' })
        }),
      )

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

      expect(deleteAllChainPreferencesMock).not.toHaveBeenCalled()
    })

    it('does not clear preferences if unregistration throws', async () => {
      // Mock the endpoint to throw an error
      server.use(
        http.delete(`${GATEWAY_URL}/v1/chains/:chainId/notifications/devices/:uuid`, () => {
          return HttpResponse.error()
        }),
      )

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

      expect(deleteAllChainPreferencesMock).not.toHaveBeenCalled()
    })

    it('clears chain preferences if unregistration succeeds', async () => {
      // Default MSW handler returns success
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

      expect(deleteAllChainPreferencesMock).toHaveBeenCalledWith('1')
    })
  })
})
