import { renderHook } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  mockActiveAllowlist,
  mockAllowlistAwaitingGuardRemoval,
  mockPendingAllowlist,
} from '../../../../public/utils/allowlistPolicies'
import { useAllowlistStatus } from '../useAllowlistStatus'

const NOW_MS = 1_800_000_000_000

const mockSafeOverviewQuery = jest.fn()

jest.mock('@/store/api/gateway', () => ({
  useGetSafeOverviewQuery: (...args: unknown[]) => mockSafeOverviewQuery(...args),
}))

jest.mock('../usePoliciesClock', () => ({
  usePoliciesClock: () => NOW_MS,
}))

describe('useAllowlistStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeOverviewQuery.mockReturnValue({ currentData: undefined })
  })

  it("should, when the applied removal waits for the guard to come off, count the signatures against the Safe's threshold", () => {
    const policy = mockAllowlistAwaitingGuardRemoval()
    mockSafeOverviewQuery.mockReturnValue({ currentData: { threshold: 3 } })

    const { result } = renderHook(() => useAllowlistStatus(policy))

    expect(mockSafeOverviewQuery).toHaveBeenCalledWith({
      chainId: policy.safe.chainId,
      safeAddress: policy.safe.address,
    })
    expect(result.current).toMatchObject({ state: 'guard-removal-pending', label: 'Pending · 0/3' })
  })

  it('should, when the allowlist waits for no guard removal, not read the Safe overview', () => {
    const { result } = renderHook(() => useAllowlistStatus(mockActiveAllowlist()))

    expect(mockSafeOverviewQuery).toHaveBeenCalledWith(skipToken)
    expect(result.current).toMatchObject({ state: 'active', label: 'Active' })
  })

  it('should, when a queued row counts its own signatures, read them from the row', () => {
    const policy = mockPendingAllowlist({
      appliesOnExecution: true,
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
    })

    const { result } = renderHook(() => useAllowlistStatus(policy))

    expect(mockSafeOverviewQuery).toHaveBeenCalledWith(skipToken)
    expect(result.current).toMatchObject({ state: 'setup-pending', label: 'Pending · 1/2' })
  })
})
