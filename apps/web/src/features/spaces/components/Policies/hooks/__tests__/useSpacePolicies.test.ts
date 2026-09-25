import { renderHook } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { SPACE_REFRESH_OPTIONS } from '../../../../hooks/refreshOptions'
import { mockProposerDto, mockSpendingLimitDto, mockUsdcMetadata } from '../../mocks/activePolicies'
import { MOCK_TOKENS } from '../../mocks/policies'
import { TABLE_POLICY_TYPES, useSpacePolicies } from '../useSpacePolicies'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

const mockUseCurrentSpaceId = jest.fn()
const mockPoliciesQuery = jest.fn()
const mockTokenInfosQuery = jest.fn()
let mockIsAuthenticated = true

jest.mock('@/features/spaces/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('@/store', () => ({
  useAppSelector: () => mockIsAuthenticated,
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: 'isAuthenticated',
}))

jest.mock('@/store/api/gateway/spacePolicies', () => ({
  useSpacePoliciesGetActivePoliciesV1Query: (...args: unknown[]) => mockPoliciesQuery(...args),
}))

jest.mock('@/store/api/gateway', () => ({
  useGetPolicyTokenInfosQuery: (...args: unknown[]) => mockTokenInfosQuery(...args),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({
    configs: [{ chainId: '1', nativeCurrency: { symbol: 'ETH', decimals: 18, logoUri: 'https://logo/eth.png' } }],
  }),
}))

const idle = { currentData: undefined, isLoading: false, isFetching: false, isError: false, refetch: jest.fn() }

describe('useSpacePolicies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockUseCurrentSpaceId.mockReturnValue(SPACE_ID)
    mockPoliciesQuery.mockReturnValue(idle)
    mockTokenInfosQuery.mockReturnValue(idle)
  })

  it('should, when signed in with a space, ask for the types the table renders', () => {
    renderHook(() => useSpacePolicies())

    expect(mockPoliciesQuery).toHaveBeenCalledWith(
      { spaceId: SPACE_ID, types: TABLE_POLICY_TYPES },
      { skip: false, ...SPACE_REFRESH_OPTIONS },
    )
  })

  it('should, when signed out, skip the request', () => {
    mockIsAuthenticated = false

    renderHook(() => useSpacePolicies())

    expect(mockPoliciesQuery).toHaveBeenCalledWith(expect.anything(), { skip: true, ...SPACE_REFRESH_OPTIONS })
  })

  it('should, when there is no current space, skip the request', () => {
    mockUseCurrentSpaceId.mockReturnValue(null)

    renderHook(() => useSpacePolicies())

    expect(mockPoliciesQuery).toHaveBeenCalledWith(expect.anything(), { skip: true, ...SPACE_REFRESH_OPTIONS })
  })

  it('should, while the policies load, report loading with no rows', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, isLoading: true, isFetching: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.policies).toEqual([])
  })

  it('should, when the request fails, report the error and hand back the refetch', () => {
    const refetch = jest.fn()
    mockPoliciesQuery.mockReturnValue({ ...idle, isError: true, refetch })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isError).toBe(true)
    result.current.refetch()
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should, while retrying after a failure, report loading rather than an empty space', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, isFetching: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(false)
  })

  it('should, while refreshing policies already on screen, not report loading', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockProposerDto()], isFetching: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.policies).toHaveLength(1)
  })

  it('should, when policies reference tokens, look their metadata up and stay loading until it is in', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockTokenInfosQuery.mockReturnValue({ ...idle, isLoading: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(mockTokenInfosQuery).toHaveBeenCalledWith({ tokens: [{ chainId: '1', address: MOCK_TOKENS.usdc.address }] })
    expect(result.current.isLoading).toBe(true)
  })

  it('should, when the metadata is in, render the token with its symbol and decimals', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockTokenInfosQuery.mockReturnValue({
      ...idle,
      currentData: { [`1:${MOCK_TOKENS.usdc.address.toLowerCase()}`]: mockUsdcMetadata() },
    })

    const { result } = renderHook(() => useSpacePolicies())
    const [policy] = result.current.policies
    if (policy.type !== 'spending-limit') throw new Error('expected a spending limit')

    expect(result.current.isLoading).toBe(false)
    expect(policy.data.spenders[0].allowances[0].token).toEqual(MOCK_TOKENS.usdc)
  })

  it('should, when an allowance is in the native currency, take it from the chain config without a lookup', () => {
    const dto = mockSpendingLimitDto()
    if (!('spenders' in dto.data)) throw new Error('expected spending limit data')
    dto.data.spenders[0].allowances[0].tokenAddress = ZERO_ADDRESS
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [dto] })

    const { result } = renderHook(() => useSpacePolicies())
    const [policy] = result.current.policies
    if (policy.type !== 'spending-limit') throw new Error('expected a spending limit')

    expect(mockTokenInfosQuery).toHaveBeenCalledWith(skipToken)
    expect(policy.data.spenders[0].allowances[0].token).toEqual({
      address: ZERO_ADDRESS,
      symbol: 'ETH',
      decimals: 18,
      logoUri: 'https://logo/eth.png',
    })
  })

  it('should, when the space has only proposer grants, not look any token up', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockProposerDto()] })

    const { result } = renderHook(() => useSpacePolicies())

    expect(mockTokenInfosQuery).toHaveBeenCalledWith(skipToken)
    expect(result.current.policies).toHaveLength(1)
    expect(result.current.policies[0].type).toBe('proposer')
  })
})
