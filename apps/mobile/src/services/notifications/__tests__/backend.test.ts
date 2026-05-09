import { Wallet } from 'ethers'
import { SiweMessage } from 'siwe'
import DeviceInfo from 'react-native-device-info'

import { NOTIFICATION_ACCOUNT_TYPE } from '@/src/store/constants'
import {
  authenticateSigner,
  registerForNotificationsOnBackEnd,
  unregisterForNotificationsOnBackEnd,
  getDeviceUuid,
} from '../backend'

// Mock modules
jest.mock('react-native-device-info')
jest.mock('@/src/utils/uuid')
jest.mock('@/src/config/constants', () => ({
  isAndroid: false,
  GATEWAY_URL: 'https://safe-client.staging.5afe.dev',
}))
jest.mock('@/src/utils/logger')

// Add MSW handlers for the API endpoints
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'

// Mock the store
const mockStore = {
  dispatch: jest.fn(),
}

jest.mock('@/src/store/utils/singletonStore', () => ({
  getStore: () => mockStore,
}))

// Mock SiweMessage
jest.mock('siwe', () => {
  return {
    SiweMessage: jest.fn().mockImplementation(function (
      this: { prepareMessage: () => string },
      params: Record<string, unknown>,
    ) {
      this.prepareMessage = () => 'prepared-siwe-message'
      Object.assign(this, params)
    }),
  }
})

// Mock dependencies
const mockDeviceInfo = DeviceInfo as jest.Mocked<typeof DeviceInfo>
const mockConvertToUuid = require('@/src/utils/uuid').convertToUuid as jest.MockedFunction<
  typeof import('@/src/utils/uuid').convertToUuid
>
const mockLogger = require('@/src/utils/logger').default as jest.Mocked<typeof import('@/src/utils/logger').default>

describe('backend notification functions', () => {
  const mockSigner = {
    address: '0x1234567890123456789012345678901234567890',
    signMessage: jest.fn().mockResolvedValue('signed-message'),
  } as unknown as Wallet

  const mockChainId = '1'
  const mockDeviceId = 'test-device-id'
  const mockDeviceUuid = 'test-device-uuid'
  const mockSafeAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef'
  const mockFcmToken = 'test-fcm-token'

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    mockDeviceInfo.getUniqueId.mockResolvedValue(mockDeviceId)
    mockConvertToUuid.mockReturnValue(mockDeviceUuid)

    // Add MSW handlers for auth and notification endpoints
    server.use(
      http.post('https://safe-client.staging.5afe.dev/v1/auth/verify', () => {
        return HttpResponse.json({}, { status: 200 })
      }),
      http.post('https://safe-client.staging.5afe.dev/v2/register/notifications', () => {
        return HttpResponse.json({}, { status: 201 })
      }),
      http.delete('https://safe-client.staging.5afe.dev/v2/notifications/subscriptions', () => {
        return HttpResponse.json({}, { status: 200 })
      }),
    )

    // Mock store dispatch to verify calls
    const mockUnwrap = jest.fn().mockResolvedValue({})
    mockStore.dispatch.mockImplementation((action) => ({
      unwrap: mockUnwrap,
      ...action,
    }))
  })

  describe('getDeviceUuid', () => {
    it('should get device UUID', async () => {
      const result = await getDeviceUuid()

      expect(mockDeviceInfo.getUniqueId).toHaveBeenCalled()
      expect(mockConvertToUuid).toHaveBeenCalledWith(mockDeviceId)
      expect(result).toBe(mockDeviceUuid)
    })
  })

  describe('authenticateSigner', () => {
    it('should authenticate a signer successfully', async () => {
      await authenticateSigner(mockSigner, mockChainId)

      // Check the signature was requested with the prepared message
      expect(mockSigner.signMessage).toHaveBeenCalledWith('prepared-siwe-message')

      // Check that store.dispatch was called for verification
      expect(mockStore.dispatch).toHaveBeenCalledTimes(1)

      // Check that SiweMessage constructor was called with the correct parameters
      expect(SiweMessage).toHaveBeenCalledWith({
        address: mockSigner.address,
        chainId: Number(mockChainId),
        domain: 'global.safe.mobileapp',
        statement: 'Safe Wallet wants you to sign in with your Ethereum account',
        nonce: expect.any(String), // Nonce is dynamic
        uri: 'https://safe.global',
        version: '1',
        issuedAt: expect.any(String),
      })

      expect(mockLogger.info).toHaveBeenCalledWith('Authenticated signer', { signerAddress: mockSigner.address })
    })

    it('should return early if signer is null', async () => {
      await authenticateSigner(null, mockChainId)

      expect(mockStore.dispatch).not.toHaveBeenCalled()
    })
  })

  describe('registerForNotificationsOnBackEnd', () => {
    it('should register for notifications as owner', async () => {
      await registerForNotificationsOnBackEnd({
        safeAddress: mockSafeAddress,
        signer: mockSigner,
        chainIds: [mockChainId],
        fcmToken: mockFcmToken,
        notificationAccountType: NOTIFICATION_ACCOUNT_TYPE.OWNER,
      })

      // Verify authentication was called
      expect(mockSigner.signMessage).toHaveBeenCalled()

      // Verify registration dispatch was called
      expect(mockStore.dispatch).toHaveBeenCalled()
    })

    it('should register for notifications as regular user', async () => {
      await registerForNotificationsOnBackEnd({
        safeAddress: mockSafeAddress,
        signer: mockSigner,
        chainIds: [mockChainId],
        fcmToken: mockFcmToken,
        notificationAccountType: NOTIFICATION_ACCOUNT_TYPE.REGULAR,
      })

      expect(mockStore.dispatch).toHaveBeenCalled()
    })
  })

  describe('unregisterForNotificationsOnBackEnd', () => {
    it('should unregister notifications successfully', async () => {
      const chainIds = ['1', '5']

      await unregisterForNotificationsOnBackEnd({
        signer: mockSigner,
        safeAddress: mockSafeAddress,
        chainIds,
      })

      // Verify authentication was called
      expect(mockSigner.signMessage).toHaveBeenCalled()

      // Verify unregistration dispatch was called
      expect(mockStore.dispatch).toHaveBeenCalled()

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Unregistering notifications for subscriptions',
        expect.objectContaining({
          deleteAllSubscriptionsDto: {
            subscriptions: chainIds.map((chainId) => ({
              chainId,
              deviceUuid: mockDeviceUuid,
              safeAddress: mockSafeAddress,
            })),
          },
        }),
      )
    })

    it('should return early if no chainIds provided', async () => {
      await unregisterForNotificationsOnBackEnd({
        signer: mockSigner,
        safeAddress: mockSafeAddress,
        chainIds: [],
      })

      expect(mockLogger.warn).toHaveBeenCalledWith('No chainIds provided for unregistering notifications', {
        safeAddress: mockSafeAddress,
      })
    })

    it('should handle 404 errors gracefully', async () => {
      // Mock the store dispatch to simulate RTK Query 404 error for unregister call
      const error404 = { status: 404 }
      const mockUnwrap = jest
        .fn()
        .mockResolvedValueOnce({}) // First call for auth succeeds
        .mockRejectedValue(error404) // Second call returns 404

      mockStore.dispatch.mockImplementation((action) => ({
        unwrap: mockUnwrap,
        ...action,
      }))

      await unregisterForNotificationsOnBackEnd({
        signer: mockSigner,
        safeAddress: mockSafeAddress,
        chainIds: [mockChainId],
      })

      expect(mockLogger.info).toHaveBeenCalledWith('Safe was already unsubscribed from notifications', {
        safeAddress: mockSafeAddress,
        chainIds: [mockChainId],
      })
    })

    it('should throw other errors', async () => {
      // Mock the store dispatch to simulate RTK Query error for unregister call
      const error = new Error('Network error')
      const mockUnwrap = jest
        .fn()
        .mockResolvedValueOnce({}) // First call for auth succeeds
        .mockRejectedValue(error) // Second call throws error

      mockStore.dispatch.mockImplementation((action) => ({
        unwrap: mockUnwrap,
        ...action,
      }))

      await expect(
        unregisterForNotificationsOnBackEnd({
          signer: mockSigner,
          safeAddress: mockSafeAddress,
          chainIds: [mockChainId],
        }),
      ).rejects.toThrow('Network error')

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to unregister notifications', {
        error,
        safeAddress: mockSafeAddress,
        chainIds: [mockChainId],
      })
    })

    it('should throw error if deviceUuid is missing', async () => {
      mockConvertToUuid.mockReturnValue('')

      await expect(
        unregisterForNotificationsOnBackEnd({
          signer: mockSigner,
          safeAddress: mockSafeAddress,
          chainIds: [mockChainId],
        }),
      ).rejects.toThrow('Missing required parameters for unregistering notifications')
    })
  })
})
