import { renderHook } from '@testing-library/react'
import { usePolicyLock } from '../usePolicyLock'

const mockUseHasFeature = jest.fn()
const mockUseSpacePlan = jest.fn()
const mockUseSpaceEntitlements = jest.fn()
const mockUseSpacesGetOne = jest.fn()

jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockUseHasFeature() }))
jest.mock('../../../../hooks/useSpacePlan', () => ({ useSpacePlan: (spaceId: string) => mockUseSpacePlan(spaceId) }))
jest.mock('../../../../hooks/billing/useSpaceEntitlements', () => ({
  useSpaceEntitlements: (spaceId: string) => mockUseSpaceEntitlements(spaceId),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: (...args: unknown[]) => mockUseSpacesGetOne(...args),
}))

const SPACE_ID = 'space-1'

const plan = (name: string) => ({
  plan: { name, status: 'active', periodEndsAt: null, daysLeft: null },
  tierName: name,
  seats: { used: 6, quota: 10 },
  isLoading: false,
  isUninitialized: false,
})

describe('usePolicyLock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockUseSpacePlan.mockReturnValue(plan('Starter'))
    mockUseSpaceEntitlements.mockReturnValue({ policyEngine: undefined })
    mockUseSpacesGetOne.mockReturnValue({ currentData: { id: SPACE_ID, name: 'Acme Inc' } })
  })

  it('should, when SAFE_PRO is off, leave the page open and skip the workspace read', () => {
    mockUseHasFeature.mockReturnValue(false)

    const { result } = renderHook(() => usePolicyLock(SPACE_ID))

    expect(result.current).toEqual({ isResolving: false })
    expect(mockUseSpacesGetOne).toHaveBeenCalledWith({ id: SPACE_ID }, { skip: true })
  })

  it('should, when the plan is still loading, report resolving and no lock', () => {
    mockUseSpacePlan.mockReturnValue({ ...plan('Starter'), isLoading: true })

    const { result } = renderHook(() => usePolicyLock(SPACE_ID))

    expect(result.current).toEqual({ isResolving: true })
  })

  it('should, when the plan queries have not started, report resolving', () => {
    mockUseSpacePlan.mockReturnValue({ ...plan('Starter'), isUninitialized: true })

    const { result } = renderHook(() => usePolicyLock(SPACE_ID))

    expect(result.current).toEqual({ isResolving: true })
  })

  it('should, when the workspace has no live plan, leave the page open', () => {
    mockUseSpacePlan.mockReturnValue({ ...plan('Starter'), plan: null })

    const { result } = renderHook(() => usePolicyLock(SPACE_ID))

    expect(result.current).toEqual({ isResolving: false })
  })

  it('should, when the catalogue has no policy key and the plan is Starter, lock with the plan, workspace and account counts', () => {
    const { result } = renderHook(() => usePolicyLock(SPACE_ID))

    expect(result.current).toEqual({
      isResolving: false,
      lock: {
        planName: 'Starter',
        workspaceName: 'Acme Inc',
        accountCounts: {
          'spending-limit': { applied: 0, total: 6 },
          proposer: { applied: 0, total: 6 },
        },
      },
    })
    expect(mockUseSpacePlan).toHaveBeenCalledWith(SPACE_ID)
  })

  it('should, when the catalogue has no policy key and the plan is Business, leave the page open', () => {
    mockUseSpacePlan.mockReturnValue(plan('Business'))

    const { result } = renderHook(() => usePolicyLock(SPACE_ID))

    expect(result.current).toEqual({ isResolving: false })
  })

  it('should, when the entitlement denies the policy engine, lock whatever the plan is called', () => {
    mockUseSpacePlan.mockReturnValue(plan('Business'))
    mockUseSpaceEntitlements.mockReturnValue({ policyEngine: false })

    const { result } = renderHook(() => usePolicyLock(SPACE_ID))

    expect(result.current.lock?.planName).toBe('Business')
  })

  it('should, when the entitlement grants the policy engine, leave the page open whatever the plan is called', () => {
    mockUseSpaceEntitlements.mockReturnValue({ policyEngine: true })

    const { result } = renderHook(() => usePolicyLock(SPACE_ID))

    expect(result.current).toEqual({ isResolving: false })
  })

  it('should, when the workspace has not loaded, name it generically', () => {
    mockUseSpacesGetOne.mockReturnValue({ currentData: undefined })

    const { result } = renderHook(() => usePolicyLock(SPACE_ID))

    expect(result.current.lock?.workspaceName).toBe('This workspace')
  })

  it('should, when the seats meter is missing, count zero accounts', () => {
    mockUseSpacePlan.mockReturnValue({ ...plan('Starter'), seats: null })

    const { result } = renderHook(() => usePolicyLock(SPACE_ID))

    expect(result.current.lock?.accountCounts.proposer).toEqual({ applied: 0, total: 0 })
  })
})
