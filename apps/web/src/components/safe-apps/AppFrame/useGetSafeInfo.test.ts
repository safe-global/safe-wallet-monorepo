import { renderHook } from '@testing-library/react'
import useGetSafeInfo from './useGetSafeInfo'
import { mockChainId, mockCurrentChain, mockIsSafeOwner, mockSafeInfo } from '@/tests/mocks/hooks'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import { useGetIsWalletProposer } from '@/hooks/useProposers'

jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({ __esModule: true, useCurrentChain: jest.fn() }))
jest.mock('@/hooks/useIsSafeOwner', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useNestedSafeOwners', () => ({ __esModule: true, useNestedSafeOwners: jest.fn() }))
jest.mock('@/hooks/useProposers', () => ({
  __esModule: true,
  default: jest.fn(),
  useGetIsWalletProposer: jest.fn(),
}))

const mockUseNestedSafeOwners = useNestedSafeOwners as jest.MockedFunction<typeof useNestedSafeOwners>
const mockUseGetIsWalletProposer = useGetIsWalletProposer as jest.MockedFunction<typeof useGetIsWalletProposer>
const mockGetIsWalletProposer = jest.fn<Promise<boolean>, []>()

describe('useGetSafeInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ implementation: { value: '0x41675C099F32341bf84BFc5382aF534df5C7461a' } })
    mockChainId('1')
    mockCurrentChain({ chainName: 'Ethereum' })
    mockIsSafeOwner(false)
    mockGetIsWalletProposer.mockResolvedValue(false)
    mockUseGetIsWalletProposer.mockReturnValue(mockGetIsWalletProposer)
    mockUseNestedSafeOwners.mockReturnValue([])
  })

  it.each([
    { isOwner: true, isProposer: true, expected: false },
    { isOwner: true, isProposer: false, expected: false },
    { isOwner: false, isProposer: true, expected: false },
    { isOwner: false, isProposer: false, expected: true },
  ])(
    'returns isReadOnly=$expected for owner=$isOwner, proposer=$isProposer',
    async ({ isOwner, isProposer, expected }) => {
      mockIsSafeOwner(isOwner)
      mockGetIsWalletProposer.mockResolvedValue(isProposer)

      const { result } = renderHook(() => useGetSafeInfo())

      expect((await result.current()).isReadOnly).toBe(expected)
    },
  )

  it('does not check the proposers for a signer', async () => {
    mockIsSafeOwner(true)

    const { result } = renderHook(() => useGetSafeInfo())

    expect((await result.current()).isReadOnly).toBe(false)
    expect(mockGetIsWalletProposer).not.toHaveBeenCalled()
  })

  it('is not read-only when the wallet owns a nested Safe that owns this Safe', async () => {
    mockUseNestedSafeOwners.mockReturnValue(['0x1234567890000000000000000000000000000001'])

    const { result } = renderHook(() => useGetSafeInfo())

    expect((await result.current()).isReadOnly).toBe(false)
    expect(mockGetIsWalletProposer).not.toHaveBeenCalled()
  })

  it('is read-only when the nested Safe owners have not loaded', async () => {
    mockUseNestedSafeOwners.mockReturnValue(null)

    const { result } = renderHook(() => useGetSafeInfo())

    expect((await result.current()).isReadOnly).toBe(true)
  })

  it('checks the proposers when the wallet is neither a signer nor a nested Safe owner', async () => {
    mockGetIsWalletProposer.mockResolvedValue(true)

    const { result } = renderHook(() => useGetSafeInfo())

    expect((await result.current()).isReadOnly).toBe(false)
    expect(mockGetIsWalletProposer).toHaveBeenCalledTimes(1)
  })
})
