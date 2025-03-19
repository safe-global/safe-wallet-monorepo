import * as firebase from 'firebase/messaging'
import { DeviceType } from '@safe-global/safe-gateway-typescript-sdk/dist/types/notifications'
import { BrowserProvider, type JsonRpcSigner, toBeHex } from 'ethers'

import * as logic from '../logic'
import * as web3 from '@/hooks/wallets/web3'
import packageJson from '../../../../../package.json'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { MockEip1193Provider } from '@/tests/mocks/providers'

jest.mock('firebase/messaging')

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(),
  },
})

Object.defineProperty(globalThis, 'navigator', {
  value: {
    serviceWorker: {
      getRegistrations: () => [],
    },
  },
})

Object.defineProperty(globalThis, 'location', {
  value: {
    origin: 'https://app.safe.global',
  },
})

const SIGNATURE =
  '0x844ba559793a122c5742e9d922ed1f4650d4efd8ea35191105ddaee6a604000165c14f56278bda8d52c9400cdaeaf5cdc38d3596264cc5ccd8f03e5619d5d9d41b'

describe('Notifications', () => {
  let alertMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    window.alert = alertMock
  })

  describe('requestNotificationPermission', () => {
    let requestPermissionMock = jest.fn()

    beforeEach(() => {
      globalThis.Notification = {
        requestPermission: requestPermissionMock,
        permission: 'default',
      } as unknown as jest.Mocked<typeof Notification>
    })

    it('should return true and not request permission again if already granted', async () => {
      globalThis.Notification = {
        requestPermission: requestPermissionMock,
        permission: 'granted',
      } as unknown as jest.Mocked<typeof Notification>

      const result = await logic.requestNotificationPermission()

      expect(requestPermissionMock).not.toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false if permission is denied', async () => {
      requestPermissionMock.mockResolvedValue('denied')

      const result = await logic.requestNotificationPermission()

      expect(requestPermissionMock).toHaveBeenCalledTimes(1)
      expect(result).toBe(false)
    })

    it('should return false if permission request throw', async () => {
      requestPermissionMock.mockImplementation(Promise.reject)

      const result = await logic.requestNotificationPermission()

      expect(requestPermissionMock).toHaveBeenCalledTimes(1)
      expect(result).toBe(false)
    })

    it('should return true if permission are granted', async () => {
      requestPermissionMock.mockResolvedValue('granted')

      const result = await logic.requestNotificationPermission()

      expect(requestPermissionMock).toHaveBeenCalledTimes(1)
      expect(result).toBe(true)
    })
  })

  describe('getRegisterDevicePayload', () => {
    it('should return the payload with signature', async () => {
      const token = crypto.randomUUID()
      jest.spyOn(firebase, 'getToken').mockImplementation(() => Promise.resolve(token))

      const mockProvider = new BrowserProvider(MockEip1193Provider)

      jest.spyOn(mockProvider, 'getSigner').mockImplementation(() =>
        Promise.resolve({
          signMessage: jest.fn().mockResolvedValueOnce(SIGNATURE),
        } as unknown as JsonRpcSigner),
      )
      jest.spyOn(web3, 'createWeb3').mockImplementation(() => mockProvider)

      const uuid = crypto.randomUUID()

      const payload = await logic.getRegisterDevicePayload({
        safesToRegister: {
          ['1']: [toBeHex('0x1', 20), toBeHex('0x2', 20)],
          ['2']: [toBeHex('0x1', 20)],
        },
        uuid,
        wallet: {
          label: 'MetaMask',
        } as ConnectedWallet,
      })

      expect(payload).toStrictEqual({
        uuid,
        cloudMessagingToken: token,
        buildNumber: '0',
        bundle: 'safe',
        deviceType: DeviceType.WEB,
        version: packageJson.version,
        timestamp: expect.any(String),
        safeRegistrations: [
          {
            chainId: '1',
            safes: [toBeHex('0x1', 20), toBeHex('0x2', 20)],
            signatures: [SIGNATURE],
          },
          {
            chainId: '2',
            safes: [toBeHex('0x1', 20)],
            signatures: [SIGNATURE],
          },
        ],
      })
    })
  })
})
