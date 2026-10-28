import { renderHook } from '@testing-library/react'
import { usePolicyDetailsBase } from '../../../hooks/usePolicyDetailsBase'
import {
  MOCK_ADDRESSES,
  asActivePolicy,
  mockActiveSpendingLimit,
  mockMultiSpenderPolicy,
  mockPendingPolicy,
  mockPendingRemoval,
} from '../../../mocks/policies'
import { useSpendingLimitDetails } from '../useSpendingLimitDetails'

jest.mock('../../../hooks/usePolicyDetailsBase')

const mockUsePolicyDetailsBase = usePolicyDetailsBase as jest.MockedFunction<typeof usePolicyDetailsBase>

const active = mockActiveSpendingLimit()

const base = {
  viewer: { address: MOCK_ADDRESSES.bob, isSigner: true },
  safe: { address: active.safe.address, name: 'Treasury' },
  names: { [MOCK_ADDRESSES.alice]: 'Alice' },
  onConnectWallet: jest.fn(),
}

describe('useSpendingLimitDetails', () => {
  beforeEach(() => {
    mockUsePolicyDetailsBase.mockReturnValue(base)
  })

  it('names the spenders of the Safe', () => {
    const multi = mockMultiSpenderPolicy()

    const { result } = renderHook(() => useSpendingLimitDetails(asActivePolicy(multi)))

    expect(mockUsePolicyDetailsBase).toHaveBeenCalledWith(
      multi.safe,
      multi.data.spenders.map(({ spender }) => spender),
    )
    expect(result.current).toMatchObject(base)
  })

  it('says the Safe allowance module enforces it', () => {
    const { result } = renderHook(() => useSpendingLimitDetails(active))

    expect(result.current.overview.enforcedBy).toBe('Safe allowance module')
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
