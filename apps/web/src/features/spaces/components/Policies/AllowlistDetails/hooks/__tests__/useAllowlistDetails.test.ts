import { renderHook } from '@testing-library/react'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { mockWallet } from '@/tests/mocks/hooks'
import { useSpaceSafes } from '../../../../../hooks/useSpaceSafes'
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

const policy = mockActiveAllowlist()

const mockSpaceSafes = (isReadOnly: boolean) =>
  mockUseSpaceSafes.mockReturnValue({
    allSafes: [
      safeItemBuilder()
        .with({ ...policy.safe, isReadOnly })
        .build(),
    ],
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: jest.fn(),
    isUninitialized: false,
  })

describe('useAllowlistDetails', () => {
  beforeEach(() => {
    mockWallet()
    mockUseMergedAddressBooks.mockReturnValue({
      list: [],
      get: (address: string) => (address === policy.safe.address ? { name: 'Treasury' } : undefined),
      getFromSpace: (address: string) => (address === MOCK_ADDRESSES.alice ? { name: 'Alice' } : undefined),
      getFromLocal: () => undefined,
      has: () => false,
    } as unknown as ReturnType<typeof useMergedAddressBooks>)
    mockSpaceSafes(false)
  })

  it('names the recipients from the Space address book and the Safe from the merged one', () => {
    const { result } = renderHook(() => useAllowlistDetails(policy, []))

    expect(result.current.names).toEqual({ [MOCK_ADDRESSES.alice]: 'Alice' })
    expect(result.current.safe).toEqual({ address: policy.safe.address, name: 'Treasury' })
  })

  it('says the Safe policy contract enforces it, with no last updated time', () => {
    const { result } = renderHook(() => useAllowlistDetails(policy, []))

    expect(result.current.overview).toEqual({ enforcedBy: 'Safe policy contract' })
  })

  it('treats a viewer who owns the Safe in the Space as a signer', () => {
    const { result } = renderHook(() => useAllowlistDetails(policy, []))

    expect(result.current.viewer.isSigner).toBe(true)
  })

  it('does not treat a viewer who only watches the Safe as a signer', () => {
    mockSpaceSafes(true)

    const { result } = renderHook(() => useAllowlistDetails(policy, []))

    expect(result.current.viewer.isSigner).toBe(false)
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
