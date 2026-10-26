import { renderHook } from '@testing-library/react'
import { usePolicyDetailsBase } from '../../../hooks/usePolicyDetailsBase'
import { mockActiveAllowlist, mockAllowlistPolicy } from '../../../mocks/allowlistPolicies'
import {
  MOCK_ADDRESSES,
  MOCK_SAFES,
  asActivePolicy,
  mockMultiSpenderPolicy,
  mockPendingPolicy,
  mockSpendingLimitPolicy,
} from '../../../mocks/policies'
import { useAllowlistDetails } from '../useAllowlistDetails'

jest.mock('../../../hooks/usePolicyDetailsBase')

const mockUsePolicyDetailsBase = usePolicyDetailsBase as jest.MockedFunction<typeof usePolicyDetailsBase>

const policy = mockActiveAllowlist()

const base = {
  viewer: { address: MOCK_ADDRESSES.bob, isSigner: true },
  safe: { address: policy.safe.address, name: 'Treasury' },
  names: { [MOCK_ADDRESSES.alice]: 'Alice' },
  onConnectWallet: jest.fn(),
}

describe('useAllowlistDetails', () => {
  beforeEach(() => {
    mockUsePolicyDetailsBase.mockReturnValue(base)
  })

  it('names the distinct recipients of the Safe', () => {
    const { result } = renderHook(() => useAllowlistDetails(policy, []))

    expect(mockUsePolicyDetailsBase).toHaveBeenCalledWith(policy.safe, [
      MOCK_ADDRESSES.alice,
      MOCK_ADDRESSES.bob,
      MOCK_ADDRESSES.unresolved,
    ])
    expect(result.current).toMatchObject(base)
  })

  it('says the Safe policy contract enforces it, with no last updated time', () => {
    const { result } = renderHook(() => useAllowlistDetails(policy, []))

    expect(result.current.overview).toEqual({ enforcedBy: 'Safe policy contract' })
  })

  describe('uncovered spending limits', () => {
    const uncovered = asActivePolicy(mockAllowlistPolicy({ spendingLimitsCovered: false }))
    const treasuryLimit = asActivePolicy(mockSpendingLimitPolicy())

    it("counts every allowance of the Safe's active spending limits", () => {
      const { result } = renderHook(() =>
        useAllowlistDetails(uncovered, [treasuryLimit, asActivePolicy(mockMultiSpenderPolicy())]),
      )

      expect(result.current.uncoveredSpendingLimitCount).toBe(6)
    })

    it('matches the Safe address case-insensitively', () => {
      const lowercased = asActivePolicy(
        mockSpendingLimitPolicy({
          safe: { ...MOCK_SAFES.treasury, address: MOCK_SAFES.treasury.address.toLowerCase() },
        }),
      )

      const { result } = renderHook(() => useAllowlistDetails(uncovered, [lowercased]))

      expect(result.current.uncoveredSpendingLimitCount).toBe(2)
    })

    it.each([
      ['on another Safe', asActivePolicy(mockSpendingLimitPolicy({ safe: MOCK_SAFES.payroll }))],
      [
        'on the same address on another chain',
        asActivePolicy(mockSpendingLimitPolicy({ safe: { ...MOCK_SAFES.treasury, chainId: '137' } })),
      ],
      ['whose module is not enabled', asActivePolicy(mockSpendingLimitPolicy({ enabled: false }))],
      ['that is still pending', mockPendingPolicy({ safe: MOCK_SAFES.treasury })],
    ])('leaves out a spending limit %s', (_, other) => {
      const { result } = renderHook(() => useAllowlistDetails(uncovered, [other]))

      expect(result.current.uncoveredSpendingLimitCount).toBe(0)
    })

    it('counts nothing when the guard also covers module transactions', () => {
      const { result } = renderHook(() => useAllowlistDetails(policy, [treasuryLimit]))

      expect(result.current.uncoveredSpendingLimitCount).toBeUndefined()
    })
  })
})
