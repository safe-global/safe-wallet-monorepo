import { renderHook } from '@/tests/test-utils'
import { PLAN_STATUS_OVERRIDE_KEY, useSpacePlan } from '../useSpacePlan'

const mockUseHasFeature = jest.fn()
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockUseHasFeature() }))

describe('useSpacePlan', () => {
  beforeEach(() => mockUseHasFeature.mockReturnValue(true))
  afterEach(() => localStorage.clear())

  it('falls back to the fixture status and lets localStorage override it', () => {
    const trial = renderHook(() => useSpacePlan()).result.current
    expect(trial.plan?.status).toBe('trialing')
    expect(trial.isTrialing).toBe(true)
    expect(trial.isPaidActive).toBe(false)

    localStorage.setItem(`SAFE_v2__${PLAN_STATUS_OVERRIDE_KEY}`, JSON.stringify('active'))
    const paid = renderHook(() => useSpacePlan()).result.current
    expect(paid.plan?.status).toBe('active')
    expect(paid.isPaidActive).toBe(true)
    expect(paid.isTrialing).toBe(false)
    expect(paid.tierName).toBe('Business')
  })

  it('reports neither trialing nor paid while SAFE_PRO is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    const { isTrialing, isPaidActive } = renderHook(() => useSpacePlan()).result.current
    expect(isTrialing).toBe(false)
    expect(isPaidActive).toBe(false)
  })
})
