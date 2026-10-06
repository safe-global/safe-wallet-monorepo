import { renderHook } from '@/tests/test-utils'
import { useSpacePlanState } from '../useSpacePlanState'

const mockUseSpacePlan = jest.fn()
jest.mock('../useSpacePlan', () => ({ useSpacePlan: (id?: string | null) => mockUseSpacePlan(id) }))
jest.mock('../useSpaceMembers', () => ({ useIsAdmin: () => true }))

describe('useSpacePlanState', () => {
  it.each([
    ['trialing', 'free_access'],
    ['active', 'active'],
    ['none', 'none'],
    ['payment_failed', 'locked'],
    ['canceled', 'locked'],
  ])('maps %s to %s', (status, expected) => {
    mockUseSpacePlan.mockReturnValue({ status, tierName: 'Business', isLoading: false, isUninitialized: false })
    expect(renderHook(() => useSpacePlanState('space-1')).result.current).toEqual({
      status: expected,
      tier: 'business',
      role: 'admin',
    })
  })

  it('is null without a Workspace or while the plan loads', () => {
    mockUseSpacePlan.mockReturnValue({ status: 'none', isLoading: true, isUninitialized: false })
    expect(renderHook(() => useSpacePlanState('space-1')).result.current).toBeNull()
    mockUseSpacePlan.mockReturnValue({ status: 'none', isLoading: false, isUninitialized: false })
    expect(renderHook(() => useSpacePlanState(null)).result.current).toBeNull()
  })
})
