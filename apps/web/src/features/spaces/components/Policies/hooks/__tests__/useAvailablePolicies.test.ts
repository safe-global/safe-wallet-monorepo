import { renderHook } from '@/tests/test-utils'
import * as spaces from '@/features/spaces'
import * as store from '@/store'
import * as policiesApi from '@safe-global/store/gateway/policies'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { availablePolicyBuilder } from '@/tests/builders/policies'
import { useAvailablePolicies } from '../useAvailablePolicies'

const CHAIN_ID = '1'
const SAFE = '0x1111111111111111111111111111111111111111'
const SPACE_ID = '42'

type QueryResult = ReturnType<typeof policiesApi.usePoliciesGetPoliciesV1Query>

// A controlled RTK Query result — no real store, no network.
const mockQueryResult = (overrides: Partial<QueryResult> = {}): QueryResult =>
  ({ currentData: undefined, isLoading: false, isError: false, refetch: jest.fn(), ...overrides }) as QueryResult

describe('useAvailablePolicies', () => {
  let querySpy: jest.SpyInstance

  beforeEach(() => {
    jest.spyOn(spaces, 'useCurrentSpaceId').mockReturnValue(SPACE_ID)
    jest.spyOn(store, 'useAppSelector').mockReturnValue(true) // isAuthenticated
    querySpy = jest.spyOn(policiesApi, 'usePoliciesGetPoliciesV1Query').mockReturnValue(mockQueryResult())
  })

  afterEach(() => jest.restoreAllMocks())

  it('queries with the space-scoped args and refresh options', () => {
    renderHook(() => useAvailablePolicies(CHAIN_ID, SAFE))

    expect(querySpy).toHaveBeenCalledWith(
      { spaceId: SPACE_ID, chainId: CHAIN_ID, safeAddress: SAFE },
      expect.objectContaining({ skip: false, refetchOnFocus: true }),
    )
  })

  it('maps the query response items to `policies`', () => {
    const item = availablePolicyBuilder().with({ type: PolicyType.TokenWithdraw }).build()
    querySpy.mockReturnValue(mockQueryResult({ currentData: { items: [item] } }))

    const { result } = renderHook(() => useAvailablePolicies(CHAIN_ID, SAFE))

    expect(result.current.policies).toEqual([item])
    expect(result.current.isLoading).toBe(false)
  })

  it('returns an empty list while data is undefined', () => {
    const { result } = renderHook(() => useAvailablePolicies(CHAIN_ID, SAFE))
    expect(result.current.policies).toEqual([])
  })

  it('surfaces loading and error states from the query', () => {
    querySpy.mockReturnValue(mockQueryResult({ isLoading: true, isError: true }))
    const { result } = renderHook(() => useAvailablePolicies(CHAIN_ID, SAFE))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(true)
  })

  it('skips the query when not signed in', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue(false)
    renderHook(() => useAvailablePolicies(CHAIN_ID, SAFE))
    expect(querySpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
  })

  it('skips the query when there is no current space', () => {
    jest.spyOn(spaces, 'useCurrentSpaceId').mockReturnValue(null)
    renderHook(() => useAvailablePolicies(CHAIN_ID, SAFE))
    expect(querySpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
  })

  it('skips the query when safeAddress is missing', () => {
    renderHook(() => useAvailablePolicies(CHAIN_ID, ''))
    expect(querySpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
  })
})
