import { renderHook } from '@testing-library/react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'
import { MOCK_SAFES } from '../../../../../public/utils/policies'
import { TRANSACTION_GUARD_ONLY, mockTreasuryAllowlistDtos } from '../../../mocks/activePolicies'
import { useIsCoveredByAllowlist } from '../useIsCoveredByAllowlist'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

const mockActivePoliciesQuery = jest.fn()

jest.mock('../../../../../public/hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: () => SPACE_ID }))
jest.mock('@/store', () => ({ useAppSelector: () => true }))
jest.mock('@/store/authSlice', () => ({ isAuthenticated: 'isAuthenticated' }))
jest.mock('@/store/api/gateway/spacePolicies', () => ({
  useSpacePoliciesGetActivePoliciesV1Query: (...args: unknown[]) => mockActivePoliciesQuery(...args),
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({
    configs: [
      chainBuilder()
        .with({ chainId: MOCK_SAFES.treasury.chainId, features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST] })
        .build(),
    ],
  }),
}))

describe('useIsCoveredByAllowlist', () => {
  it('should, when the Safe has an allowlist in both guard slots, say its spending limits are covered', () => {
    mockActivePoliciesQuery.mockReturnValue({ currentData: mockTreasuryAllowlistDtos() })

    const { result } = renderHook(() =>
      useIsCoveredByAllowlist(MOCK_SAFES.treasury.chainId, MOCK_SAFES.treasury.address),
    )

    expect(result.current).toBe(true)
  })

  it('should, when the guard of the allowlist is not in the module slot, say its spending limits are not covered', () => {
    mockActivePoliciesQuery.mockReturnValue({ currentData: mockTreasuryAllowlistDtos(TRANSACTION_GUARD_ONLY) })

    const { result } = renderHook(() =>
      useIsCoveredByAllowlist(MOCK_SAFES.treasury.chainId, MOCK_SAFES.treasury.address),
    )

    expect(result.current).toBe(false)
  })

  it('should, when another Safe has the allowlist, say the chosen Safe is not covered', () => {
    mockActivePoliciesQuery.mockReturnValue({ currentData: mockTreasuryAllowlistDtos() })

    const { result } = renderHook(() => useIsCoveredByAllowlist(MOCK_SAFES.grants.chainId, MOCK_SAFES.grants.address))

    expect(result.current).toBe(false)
  })

  it('should, when no Safe is chosen yet, say nothing is covered', () => {
    mockActivePoliciesQuery.mockReturnValue({ currentData: mockTreasuryAllowlistDtos() })

    const { result } = renderHook(() => useIsCoveredByAllowlist(undefined, undefined))

    expect(result.current).toBe(false)
  })
})
