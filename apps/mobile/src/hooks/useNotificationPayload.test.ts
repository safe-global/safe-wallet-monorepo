import { renderHook } from '@/src/tests/test-utils'
import { useNotificationPayload } from './useNotificationPayload'
import { useAuthGetNonceV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useSiwe } from '@/src/hooks/useSiwe'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

import { Wallet } from 'ethers'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth')
jest.mock('@/src/hooks/useSiwe')
jest.mock('@/src/store/hooks/activeSafe')
jest.mock('@/src/store/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) => {
    if (selector.name === 'selectSafeInfo') {
      return { SafeInfo: { owners: [{ value: 'owner1' }] } }
    }
    return {}
  },
}))
jest.mock('@/src/store/safesSlice')
jest.mock('@/src/utils/logger')

describe('useNotificationPayload', () => {
  const mockCreateSiweMessage = jest.fn()
  const mockUseAuthGetNonceV1Query = useAuthGetNonceV1Query as jest.Mock
  const mockUseSiwe = useSiwe as jest.Mock
  const mockUseDefinedActiveSafe = useDefinedActiveSafe as jest.Mock

  beforeEach(() => {
    mockUseAuthGetNonceV1Query.mockReturnValue({ data: 'mockNonce' })
    mockUseSiwe.mockReturnValue({ createSiweMessage: mockCreateSiweMessage })
    mockUseDefinedActiveSafe.mockReturnValue({ address: 'mockAddress', chainId: '1' })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('throws an error if required data is missing', async () => {
    const { result } = renderHook(() => useNotificationPayload())
    await expect(
      result.current.getNotificationRegisterPayload({ nonce: undefined, signer: Wallet.createRandom() }),
    ).rejects.toThrow('useDelegateKey: Something went wrong')
  })

  it('returns the correct payload', async () => {
    const mockSigner = Wallet.createRandom()
    mockCreateSiweMessage.mockReturnValue('mockSiweMessage')

    const { result } = renderHook(() => useNotificationPayload())
    const payload = await result.current.getNotificationRegisterPayload({ nonce: 'mockNonce', signer: mockSigner })

    expect(payload).toEqual({
      siweMessage: 'mockSiweMessage',
    })
  })
})
