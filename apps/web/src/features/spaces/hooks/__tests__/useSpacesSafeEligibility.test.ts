import { faker } from '@faker-js/faker'
import { skipToken } from '@reduxjs/toolkit/query'
import { act, renderHook } from '@testing-library/react'
import { useSpacesSafeEligibility } from '../useSpacesSafeEligibility'

const mockUseIsSafeProEnabled = jest.fn()
const mockUseSpaceSafesGetAllV1Query = jest.fn()
const mockUseEntitlementsGetAllEntitlementsV1Query = jest.fn()
jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => mockUseIsSafeProEnabled() }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetAllV1Query: (...args: unknown[]) => mockUseSpaceSafesGetAllV1Query(...args),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/entitlements', () => ({
  useEntitlementsGetAllEntitlementsV1Query: (...args: unknown[]) =>
    mockUseEntitlementsGetAllEntitlementsV1Query(...args),
}))
jest.mock('../../constants', () => ({ SAFE_ACCOUNTS_LIMIT: 40 }))

const spaceId = faker.string.uuid()
const otherSpaceId = faker.string.uuid()
const safeAddress = faker.finance.ethereumAddress()

const seatsEntitlements = (quota: number | null) => ({
  plan: null,
  entitlements: [{ feature: 'safe_seats', type: 'metered', quota, used: 1, resetsAt: null }],
})

const queryResult = (overrides: Record<string, unknown> = {}) => ({
  currentData: undefined,
  isLoading: false,
  isFetching: false,
  error: undefined,
  refetch: jest.fn(),
  ...overrides,
})

describe('useSpacesSafeEligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsSafeProEnabled.mockReturnValue(true)
    mockUseSpaceSafesGetAllV1Query.mockReturnValue(queryResult({ currentData: { [spaceId]: { '1': [safeAddress] } } }))
    mockUseEntitlementsGetAllEntitlementsV1Query.mockReturnValue(
      queryResult({ currentData: { [spaceId]: seatsEntitlements(5), [otherSpaceId]: seatsEntitlements(null) } }),
    )
  })

  it('sends one request for the Safes and one for the entitlements of all Workspaces', () => {
    renderHook(() => useSpacesSafeEligibility(true))

    expect(mockUseSpaceSafesGetAllV1Query).toHaveBeenLastCalledWith(undefined, expect.any(Object))
    expect(mockUseEntitlementsGetAllEntitlementsV1Query).toHaveBeenLastCalledWith(undefined, expect.any(Object))
  })

  it('skips both requests when it is not enabled', () => {
    renderHook(() => useSpacesSafeEligibility(false))

    expect(mockUseSpaceSafesGetAllV1Query).toHaveBeenLastCalledWith(skipToken, expect.any(Object))
    expect(mockUseEntitlementsGetAllEntitlementsV1Query).toHaveBeenLastCalledWith(skipToken, expect.any(Object))
  })

  it('gives the Safes and the seat quota of each Workspace', () => {
    const { result } = renderHook(() => useSpacesSafeEligibility(true))

    expect(result.current.getSafes(spaceId)).toEqual({ '1': [safeAddress] })
    expect(result.current.getSafes(otherSpaceId)).toBeUndefined()
    expect(result.current.getLimit(spaceId)).toBe(5)
    expect(result.current.getLimit(otherSpaceId)).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('leaves the limit unknown for a Workspace without a seats meter', () => {
    const { result } = renderHook(() => useSpacesSafeEligibility(true))

    expect(result.current.getLimit(faker.string.uuid())).toBeUndefined()
  })

  it('uses the static cap and skips the entitlements request while Safe Pro is off', () => {
    mockUseIsSafeProEnabled.mockReturnValue(false)
    const { result } = renderHook(() => useSpacesSafeEligibility(true))

    expect(mockUseEntitlementsGetAllEntitlementsV1Query).toHaveBeenLastCalledWith(skipToken, expect.any(Object))
    expect(result.current.getLimit(spaceId)).toBe(40)
  })

  it.each([
    ['the Safes', mockUseSpaceSafesGetAllV1Query],
    ['the entitlements', mockUseEntitlementsGetAllEntitlementsV1Query],
  ])('is loading while %s load', (_, query) => {
    query.mockReturnValue(queryResult({ isLoading: true }))

    expect(renderHook(() => useSpacesSafeEligibility(true)).result.current.isLoading).toBe(true)
  })

  it('is loading while a refetch runs without data', () => {
    mockUseSpaceSafesGetAllV1Query.mockReturnValue(queryResult({ isFetching: true }))

    expect(renderHook(() => useSpacesSafeEligibility(true)).result.current.isLoading).toBe(true)
  })

  it('stays loading and retries while the entitlements are rate limited', () => {
    jest.useFakeTimers()
    const refetch = jest.fn()
    mockUseEntitlementsGetAllEntitlementsV1Query.mockReturnValue(queryResult({ error: { status: 429 }, refetch }))

    const { result } = renderHook(() => useSpacesSafeEligibility(true))
    expect(result.current.isLoading).toBe(true)

    act(() => jest.advanceTimersByTime(1_000))
    expect(refetch).toHaveBeenCalledTimes(1)
    jest.useRealTimers()
  })

  it('is not loading after a failure that is not a rate limit', () => {
    mockUseSpaceSafesGetAllV1Query.mockReturnValue(queryResult({ error: { status: 500 } }))
    const { result } = renderHook(() => useSpacesSafeEligibility(true))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.getSafes(spaceId)).toBeUndefined()
  })
})
