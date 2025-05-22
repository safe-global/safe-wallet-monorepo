import { act, renderHook } from '@/src/tests/test-utils'
import { useNotificationPayload } from './useNotificationPayload'
import { useSiwe } from '@/src/hooks/useSiwe'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { Wallet } from 'ethers'
import { RootState } from '@/src/store'

// Keep these mocks as they're not part of the store
jest.mock('@/src/hooks/useSiwe')
jest.mock('@/src/store/hooks/activeSafe')
jest.mock('@/src/utils/logger')

describe('useNotificationPayload', () => {
  const mockCreateSiweMessage = jest.fn()
  const mockUseSiwe = useSiwe as jest.Mock
  const mockUseDefinedActiveSafe = useDefinedActiveSafe as jest.Mock

  // Create a proper initial store state for testing
  const initialStoreState: Partial<RootState> = {
    notifications: {
      isAppNotificationsEnabled: true,
      isDeviceNotificationsEnabled: false,
      fcmToken: null,
      remoteMessages: [],
      promptAttempts: 0,
      lastTimePromptAttempted: null,
    },
    settings: {
      themePreference: 'light',
      onboardingVersionSeen: '1.0.0',
      env: {
        rpc: {},
        tenderly: {
          url: '',
          accessToken: '',
        },
      },
    },
    safes: {},
  }

  beforeEach(() => {
    mockUseSiwe.mockReturnValue({ createSiweMessage: mockCreateSiweMessage })
    mockUseDefinedActiveSafe.mockReturnValue({ address: 'mockAddress', chainId: '1' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('throws an error if signer is missing', async () => {
    const { result } = renderHook(() => useNotificationPayload(), initialStoreState)

    await act(async () => {
      await expect(
        result.current.getNotificationRegisterPayload({
          signer: null as unknown as Wallet,
          chainId: '1',
        }),
      ).rejects.toThrow('registerForNotifications: Signer account not found')
    })
  })

  it('returns the correct payload', async () => {
    const mockSigner = Wallet.createRandom()
    mockCreateSiweMessage.mockReturnValue('mockSiweMessage')

    const { result } = renderHook(() => useNotificationPayload(), initialStoreState)
    let payload
    await act(async () => {
      payload = await result.current.getNotificationRegisterPayload({
        signer: mockSigner,
        chainId: '1',
      })
    })
    expect(payload).toEqual({
      siweMessage: 'mockSiweMessage',
    })
    expect(mockCreateSiweMessage).toHaveBeenCalled()
  })
})
