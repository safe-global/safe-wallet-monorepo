import { renderHook } from '@testing-library/react'
import {
  type DelegatePage,
  useDelegatesGetDelegatesV2Query,
  useLazyDelegatesGetDelegatesV2Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { mockSafeInfo, mockWallet } from '@/tests/mocks/hooks'
import { useGetIsWalletProposer, useIsWalletProposer } from '../useProposers'

jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/delegates', () => ({
  useDelegatesGetDelegatesV2Query: jest.fn(),
  useLazyDelegatesGetDelegatesV2Query: jest.fn(),
}))

const mockUseDelegatesGetDelegatesV2Query = useDelegatesGetDelegatesV2Query as jest.MockedFunction<
  typeof useDelegatesGetDelegatesV2Query
>
const mockUseLazyDelegatesGetDelegatesV2Query = useLazyDelegatesGetDelegatesV2Query as jest.MockedFunction<
  typeof useLazyDelegatesGetDelegatesV2Query
>

const proposerAddress = '0x1234567890000000000000000000000000000001'
const otherAddress = '0x1234567890000000000000000000000000000002'
const proposerPage: DelegatePage = {
  results: [{ delegate: proposerAddress, delegator: proposerAddress, label: 'Proposer' }],
}

const mockUnwrap = jest.fn()
const mockFetchProposers = jest.fn(() => ({ unwrap: mockUnwrap }))

const mockProposersData = (data?: DelegatePage) => {
  mockUseDelegatesGetDelegatesV2Query.mockReturnValue({ data } as unknown as ReturnType<
    typeof useDelegatesGetDelegatesV2Query
  >)
}

describe('useProposers', () => {
  let safeInfo: ReturnType<typeof mockSafeInfo>

  beforeEach(() => {
    jest.clearAllMocks()
    safeInfo = mockSafeInfo()
    mockWallet({ address: proposerAddress })
    mockProposersData(proposerPage)
    mockUnwrap.mockResolvedValue(proposerPage)
    mockFetchProposers.mockReturnValue({ unwrap: mockUnwrap })
    mockUseLazyDelegatesGetDelegatesV2Query.mockReturnValue([mockFetchProposers] as unknown as ReturnType<
      typeof useLazyDelegatesGetDelegatesV2Query
    >)
  })

  describe('useIsWalletProposer', () => {
    it('identifies the connected wallet as a proposer', () => {
      const { result } = renderHook(() => useIsWalletProposer())

      expect(result.current).toBe(true)
    })

    it('returns false for a wallet that is not a proposer', () => {
      mockWallet({ address: otherAddress })

      const { result } = renderHook(() => useIsWalletProposer())

      expect(result.current).toBe(false)
    })

    it('returns undefined until the proposers have loaded', () => {
      mockProposersData(undefined)

      const { result } = renderHook(() => useIsWalletProposer())

      expect(result.current).toBeUndefined()
    })
  })

  describe('useGetIsWalletProposer', () => {
    it('resolves from the loaded proposers without fetching again', async () => {
      const { result } = renderHook(() => useGetIsWalletProposer())

      await expect(result.current()).resolves.toBe(true)
      expect(mockFetchProposers).not.toHaveBeenCalled()
    })

    it('fetches the proposers, preferring the cache, when the status is not known yet', async () => {
      mockProposersData(undefined)

      const { result } = renderHook(() => useGetIsWalletProposer())

      await expect(result.current()).resolves.toBe(true)
      expect(mockFetchProposers).toHaveBeenCalledWith({ chainId: safeInfo.chainId, safe: safeInfo.address.value }, true)
    })

    it('resolves false when the fetched proposers do not include the wallet', async () => {
      mockProposersData(undefined)
      mockWallet({ address: otherAddress })

      const { result } = renderHook(() => useGetIsWalletProposer())

      await expect(result.current()).resolves.toBe(false)
    })

    it('resolves false when the proposers cannot be fetched', async () => {
      mockProposersData(undefined)
      mockUnwrap.mockRejectedValue(new Error('Request failed'))

      const { result } = renderHook(() => useGetIsWalletProposer())

      await expect(result.current()).resolves.toBe(false)
    })

    it('resolves false without fetching when the Safe is not loaded yet', async () => {
      mockProposersData(undefined)
      mockSafeInfo({ address: { value: '' } })

      const { result } = renderHook(() => useGetIsWalletProposer())

      await expect(result.current()).resolves.toBe(false)
      expect(mockFetchProposers).not.toHaveBeenCalled()
    })

    it('resolves false without fetching when no wallet is connected', async () => {
      mockProposersData(undefined)
      mockWallet(null)

      const { result } = renderHook(() => useGetIsWalletProposer())

      await expect(result.current()).resolves.toBe(false)
      expect(mockFetchProposers).not.toHaveBeenCalled()
    })
  })
})
