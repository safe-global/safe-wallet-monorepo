import { renderHook } from '@testing-library/react'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { mockWallet } from '@/tests/mocks/hooks'
import { useSpaceSafes } from '../../../../../hooks/useSpaceSafes'
import { mockActiveSpendingLimit, mockPendingPolicy, mockPendingRemoval } from '../../../mocks/policies'
import { useSpendingLimitDetails } from '../useSpendingLimitDetails'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/components/common/ConnectWallet/useConnectWallet')
jest.mock('../../../../../hooks/useSpaceSafes')
// Stubbed wholesale: this module sits in the spaces barrel import cycle.
jest.mock('@/hooks/useAllAddressBooks', () => ({
  __esModule: true,
  useMergedAddressBooks: jest.fn(),
}))

const mockUseSpaceSafes = useSpaceSafes as jest.MockedFunction<typeof useSpaceSafes>
const mockUseMergedAddressBooks = useMergedAddressBooks as jest.MockedFunction<typeof useMergedAddressBooks>

const active = mockActiveSpendingLimit()

describe('useSpendingLimitDetails', () => {
  beforeEach(() => {
    mockWallet()
    mockUseMergedAddressBooks.mockReturnValue({
      list: [],
      get: () => undefined,
      getFromSpace: () => undefined,
      getFromLocal: () => undefined,
      has: () => false,
    })
    mockUseSpaceSafes.mockReturnValue({
      allSafes: [
        safeItemBuilder()
          .with({ ...active.safe, isReadOnly: false })
          .build(),
      ],
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: jest.fn(),
      isUninitialized: false,
    })
  })

  it('formats when an active policy was last set', () => {
    const { result } = renderHook(() => useSpendingLimitDetails(active))

    expect(result.current.overview.lastUpdated).toBe('Jun 24, 2026 · 03:35 UTC')
  })

  it('omits the last updated time for a queued change, even one that carries the active createdAt', () => {
    const removal = mockPendingRemoval()
    expect(removal.data.spenders[0].allowances[0].createdAt).toBeDefined()

    const { result } = renderHook(() => useSpendingLimitDetails(removal))

    expect(result.current.overview.lastUpdated).toBeUndefined()
  })

  it('omits the last updated time for a queued creation', () => {
    const { result } = renderHook(() => useSpendingLimitDetails(mockPendingPolicy()))

    expect(result.current.overview.lastUpdated).toBeUndefined()
  })
})
