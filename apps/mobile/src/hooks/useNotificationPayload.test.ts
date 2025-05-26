import { renderHook } from '@/src/tests/test-utils'
import { useNotificationPayload } from './useNotificationPayload'
import { useSiwe } from '@/src/hooks/useSiwe'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { Wallet } from 'ethers'

jest.mock('@/src/hooks/useSiwe')
jest.mock('@/src/store/hooks/activeSafe')
jest.mock('@/src/store/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => {
    if (selector.name === 'selectSafeInfo') {
      return {
        '1': {
          owners: [{ value: 'owner1' }],
          address: { value: '0x1' },
          chainId: '1',
          threshold: 1,
          fiatTotal: '0',
          queued: 0,
        },
      }
    }
    return {}
  },
}))
jest.mock('@/src/store/safesSlice')
jest.mock('@/src/utils/logger')

describe('useNotificationPayload', () => {
  const mockCreateSiweMessage = jest.fn()
  const mockUseSiwe = useSiwe as jest.Mock
  const mockUseDefinedActiveSafe = useDefinedActiveSafe as jest.Mock

  beforeEach(() => {
    mockUseSiwe.mockReturnValue({ createSiweMessage: mockCreateSiweMessage })
    mockUseDefinedActiveSafe.mockReturnValue({ address: 'mockAddress', chainId: '1' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('throws an error if signer is missing', async () => {
    const { result } = renderHook(() => useNotificationPayload())
    await expect(
      result.current.getNotificationRegisterPayload({
        nonce: 'mock-nonce',
        signer: null as unknown as Wallet,
        chainId: '1',
      }),
    ).rejects.toThrow('registerForNotifications: Signer account not found')
  })

  it('returns the correct payload', async () => {
    const mockSigner = Wallet.createRandom()
    mockCreateSiweMessage.mockReturnValue('mockSiweMessage')

    const { result } = renderHook(() => useNotificationPayload())
    const payload = await result.current.getNotificationRegisterPayload({
      nonce: 'mock-nonce-for-testing-12345',
      signer: mockSigner,
      chainId: '1',
    })

    expect(payload).toEqual({
      siweMessage: 'mockSiweMessage',
    })
    expect(mockCreateSiweMessage).toHaveBeenCalled()
  })
})
