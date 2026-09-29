import { renderHook } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import { SPACE_REFRESH_OPTIONS } from '../../../../hooks/refreshOptions'
import { mockProposerDto, mockSpendingLimitDto, mockUsdcMetadata } from '../../mocks/activePolicies'
import { mockPendingDto } from '../../mocks/pendingPolicies'
import { MOCK_TOKENS, mockActivatingPolicy } from '../../mocks/policies'
import { PENDING_POLICY_TYPES, TABLE_POLICY_TYPES, useSpacePolicies } from '../useSpacePolicies'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

const mockUseCurrentSpaceId = jest.fn()
const mockPoliciesQuery = jest.fn()
const mockPendingQuery = jest.fn()
const mockTokenInfosQuery = jest.fn()
const mockUseActivatingPolicies = jest.fn()
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
  useSpacePoliciesGetPendingPoliciesV1Query: (...args: unknown[]) => mockPendingQuery(...args),
}))

jest.mock('@/store/api/gateway', () => ({
  useGetPolicyTokenInfosQuery: (...args: unknown[]) => mockTokenInfosQuery(...args),
}))

jest.mock('../useActivatingPolicies', () => ({
  useActivatingPolicies: (...args: unknown[]) => mockUseActivatingPolicies(...args),
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
    mockPendingQuery.mockReturnValue(idle)
    mockTokenInfosQuery.mockReturnValue(idle)
    mockUseActivatingPolicies.mockReturnValue([])
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

  it('should ask for the pending spending limits of the space', () => {
    renderHook(() => useSpacePolicies())

    expect(mockPendingQuery).toHaveBeenCalledWith(
      { spaceId: SPACE_ID, types: PENDING_POLICY_TYPES },
      { skip: false, ...SPACE_REFRESH_OPTIONS },
    )
  })

  it('should, when a Safe has an active limit and a queued change, return both rows', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [mockPendingDto()] })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.policies.map((policy) => policy.status)).toEqual(['active', 'pending'])
  })

  it('should, when an executed change is not yet indexed, append its activating row', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [mockPendingDto()] })
    mockUseActivatingPolicies.mockReturnValue([mockActivatingPolicy()])

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.policies.map((policy) => policy.status)).toEqual(['active', 'pending', 'activating'])
  })

  it('should, when only a queued creation exists, still return a row', () => {
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [mockPendingDto()] })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.policies).toHaveLength(1)
  })

  it('should, when the pending request fails, keep the active rows and report no error', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockPendingQuery.mockReturnValue({ ...idle, isError: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isError).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.policies).toHaveLength(1)
  })

  it('should, while pending rows load for the first time, show the active rows', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockPendingQuery.mockReturnValue({ ...idle, isLoading: true, isFetching: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.policies.map((policy) => policy.status)).toEqual(['active'])
  })

  it('should, while the tokens only a queued change uses load, show the active rows alone', () => {
    const pendingDto = mockPendingDto()
    const [addDelegate, setAllowance] = pendingDto.data.changes
    if (setAllowance.kind !== 'set-allowance') throw new Error('expected a set-allowance')
    pendingDto.data.changes = [addDelegate, { ...setAllowance, token: MOCK_TOKENS.usdt.address }]
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [pendingDto] })
    mockTokenInfosQuery.mockImplementation((arg: typeof skipToken | { tokens: { address: string }[] }) =>
      arg !== skipToken && arg.tokens.some((token) => token.address === MOCK_TOKENS.usdt.address)
        ? { ...idle, isLoading: true }
        : idle,
    )

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.policies.map((policy) => policy.status)).toEqual(['active'])
  })

  it('should, while retrying the pending rows after a failure, keep the active rows on screen', () => {
    mockPoliciesQuery.mockReturnValue({ ...idle, currentData: [mockSpendingLimitDto()] })
    mockPendingQuery.mockReturnValue({ ...idle, isFetching: true })

    const { result } = renderHook(() => useSpacePolicies())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.policies).toHaveLength(1)
  })

  it('should hand the activating rows the space and whether the requests run', () => {
    mockIsAuthenticated = false

    renderHook(() => useSpacePolicies())

    expect(mockUseActivatingPolicies).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      refetchActive: idle.refetch,
      resetKey: SPACE_ID,
      enabled: false,
    })
  })

  it('should, when a Safe transaction is proposed, refetch the pending rows', () => {
    const refetchPending = jest.fn()
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [], refetch: refetchPending })
    renderHook(() => useSpacePolicies())

    txDispatch(TxEvent.PROPOSED, { txId: 'multisig_0x1_0xabc', nonce: 1, chainId: '1', safeAddress: '0x1' })

    expect(refetchPending).toHaveBeenCalled()
  })

  it('should, when a signature is submitted onchain, refetch the pending rows', () => {
    const refetchPending = jest.fn()
    mockPendingQuery.mockReturnValue({ ...idle, currentData: [], refetch: refetchPending })
    renderHook(() => useSpacePolicies())

    txDispatch(TxEvent.ONCHAIN_SIGNATURE_SUCCESS, { txId: 'multisig_0x1_0xabc', nonce: 1 })

    expect(refetchPending).toHaveBeenCalled()
  })
})
