import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import type { DelegatePage } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { mockSafeInfo, mockWallet } from '@/tests/mocks/hooks'
import useProposers, { useGetIsWalletProposer, useIsWalletProposer } from '../useProposers'

jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({ useHasFeature: jest.fn() }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/delegates', () => ({
  useDelegatesGetDelegatesV2Query: jest.fn(),
  useDelegatesGetDelegatesV3Query: jest.fn(),
  useLazyDelegatesGetDelegatesV2Query: jest.fn(),
  useLazyDelegatesGetDelegatesV3Query: jest.fn(),
}))

const {
  useDelegatesGetDelegatesV2Query,
  useDelegatesGetDelegatesV3Query,
  useLazyDelegatesGetDelegatesV2Query,
  useLazyDelegatesGetDelegatesV3Query,
} = jest.requireMock<
  Record<
    | 'useDelegatesGetDelegatesV2Query'
    | 'useDelegatesGetDelegatesV3Query'
    | 'useLazyDelegatesGetDelegatesV2Query'
    | 'useLazyDelegatesGetDelegatesV3Query',
    jest.Mock
  >
>('@safe-global/store/gateway/AUTO_GENERATED/delegates')

const { useHasFeature } = jest.requireMock<Record<'useHasFeature', jest.Mock>>('@/hooks/useChains')

const proposerAddress = checksumAddress(faker.finance.ethereumAddress())
const otherAddress = checksumAddress(faker.finance.ethereumAddress())
const proposerPage: DelegatePage = {
  results: [{ delegate: proposerAddress, delegator: proposerAddress, label: faker.word.words() }],
}

describe.each([
  {
    service: 'queue service',
    isQueueService: true,
    query: useDelegatesGetDelegatesV3Query,
    lazyQuery: useLazyDelegatesGetDelegatesV3Query,
    otherQuery: useDelegatesGetDelegatesV2Query,
    otherLazyQuery: useLazyDelegatesGetDelegatesV2Query,
  },
  {
    service: 'transaction service',
    isQueueService: false,
    query: useDelegatesGetDelegatesV2Query,
    lazyQuery: useLazyDelegatesGetDelegatesV2Query,
    otherQuery: useDelegatesGetDelegatesV3Query,
    otherLazyQuery: useLazyDelegatesGetDelegatesV3Query,
  },
])('useProposers on a $service chain', ({ isQueueService, query, lazyQuery, otherQuery, otherLazyQuery }) => {
  let safeInfo: ReturnType<typeof mockSafeInfo>

  const mockUnwrap = jest.fn()
  const mockFetchProposers = jest.fn(() => ({ unwrap: mockUnwrap }))
  const mockFetchOtherProposers = jest.fn(() => ({ unwrap: mockUnwrap }))

  const mockProposersData = (data?: DelegatePage) => {
    query.mockReturnValue({ data })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    safeInfo = mockSafeInfo()
    mockWallet({ address: proposerAddress })
    useHasFeature.mockReturnValue(isQueueService)
    mockProposersData(proposerPage)
    otherQuery.mockReturnValue({ data: undefined })
    mockUnwrap.mockResolvedValue(proposerPage)
    mockFetchProposers.mockReturnValue({ unwrap: mockUnwrap })
    lazyQuery.mockReturnValue([mockFetchProposers])
    otherLazyQuery.mockReturnValue([mockFetchOtherProposers])
  })

  describe('useProposers', () => {
    it('queries the delegates of the current Safe on the matching service only', () => {
      const { result } = renderHook(() => useProposers())

      expect(result.current.data).toBe(proposerPage)
      expect(useHasFeature).toHaveBeenCalledWith(FEATURES.QUEUE_SERVICE)
      expect(query).toHaveBeenCalledWith({ chainId: safeInfo.chainId, safe: safeInfo.address.value }, { skip: false })
      expect(otherQuery).toHaveBeenCalledWith(expect.anything(), { skip: true })
    })

    it('skips both services while the Safe is not loaded', () => {
      mockSafeInfo({ address: { value: '' } })

      renderHook(() => useProposers())

      expect(query).toHaveBeenCalledWith(undefined, { skip: true })
      expect(otherQuery).toHaveBeenCalledWith(undefined, { skip: true })
    })
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
      expect(mockFetchOtherProposers).not.toHaveBeenCalled()
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

describe('useProposers while the chain config is loading', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo()
    mockWallet({ address: proposerAddress })
    useHasFeature.mockReturnValue(undefined)
    useDelegatesGetDelegatesV2Query.mockReturnValue({ data: undefined })
    useDelegatesGetDelegatesV3Query.mockReturnValue({ data: undefined })
  })

  it('fetches from neither service', () => {
    renderHook(() => useProposers())

    expect(useDelegatesGetDelegatesV2Query).toHaveBeenCalledWith(undefined, { skip: true })
    expect(useDelegatesGetDelegatesV3Query).toHaveBeenCalledWith(undefined, { skip: true })
  })

  it('does not know yet whether the wallet is a proposer', () => {
    const { result } = renderHook(() => useIsWalletProposer())

    expect(result.current).toBeUndefined()
  })
})
