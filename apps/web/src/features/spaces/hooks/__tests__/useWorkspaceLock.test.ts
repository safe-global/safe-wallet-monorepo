import { renderHook } from '@testing-library/react'
import { useWorkspaceLock } from '../useWorkspaceLock'

const mockUseHasFeature = jest.fn()
const mockUseIsInvited = jest.fn()
const mockUseSpacePlan = jest.fn()
const mockUseSpaceOffers = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockUseHasFeature() }))
jest.mock('../useSpaceMembers', () => ({ useIsInvited: () => mockUseIsInvited() }))
jest.mock('../useSpacePlan', () => ({ useSpacePlan: (spaceId?: string) => mockUseSpacePlan(spaceId) }))
jest.mock('../billing/useSpaceOffers', () => ({ useSpaceOffers: (spaceId?: string) => mockUseSpaceOffers(spaceId) }))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'

describe('useWorkspaceLock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockUseIsInvited.mockReturnValue(false)
    mockUseSpacePlan.mockReturnValue({ status: 'none', isLoading: false })
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: 60, isLoading: false })
  })

  it.each(['none', 'canceled', 'payment_failed', 'pending'])('locks a Workspace whose plan status is %s', (status) => {
    mockUseSpacePlan.mockReturnValue({ status, isLoading: false })
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: false })

    expect(renderHook(() => useWorkspaceLock()).result.current).toMatchObject({ isLocked: true, trialPeriodDays: null })
  })

  it('locks a never-subscribed Workspace that is offered a trial, scoped to the given space', () => {
    const { result } = renderHook(() => useWorkspaceLock(SPACE_ID))

    expect(result.current).toEqual({ isLocked: true, isResolving: false, trialPeriodDays: 60 })
    expect(mockUseSpacePlan).toHaveBeenCalledWith(SPACE_ID)
    expect(mockUseSpaceOffers).toHaveBeenCalledWith(SPACE_ID)
  })

  it.each([
    ['SAFE_PRO is off', () => mockUseHasFeature.mockReturnValue(false)],
    ['the user is only invited', () => mockUseIsInvited.mockReturnValue(true)],
    ['the Workspace is on a trial', () => mockUseSpacePlan.mockReturnValue({ status: 'trialing', isLoading: false })],
    ['the Workspace is on a paid plan', () => mockUseSpacePlan.mockReturnValue({ status: 'active', isLoading: false })],
  ])('does not lock when %s', (_, arrange) => {
    arrange()

    expect(renderHook(() => useWorkspaceLock()).result.current.isLocked).toBe(false)
  })

  it('reports resolving, and not locked, while either source is loading', () => {
    mockUseSpaceOffers.mockReturnValue({ trialPeriodDays: null, isLoading: true })

    expect(renderHook(() => useWorkspaceLock()).result.current).toMatchObject({ isLocked: false, isResolving: true })
  })

  it('never reports resolving while the lock does not apply', () => {
    mockUseHasFeature.mockReturnValue(false)
    mockUseSpacePlan.mockReturnValue({ status: 'none', isLoading: true })

    expect(renderHook(() => useWorkspaceLock()).result.current.isResolving).toBe(false)
  })
})
