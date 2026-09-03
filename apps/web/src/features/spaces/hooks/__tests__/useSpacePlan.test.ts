import { renderHook } from '@/tests/test-utils'
import { PLAN_STATUS_OVERRIDE_KEY, useSpacePlan } from '../useSpacePlan'

describe('useSpacePlan', () => {
  afterEach(() => localStorage.clear())

  it('falls back to the fixture status and lets localStorage override it', () => {
    expect(renderHook(() => useSpacePlan()).result.current.plan?.status).toBe('trialing')

    localStorage.setItem(`SAFE_v2__${PLAN_STATUS_OVERRIDE_KEY}`, JSON.stringify('active'))
    const { result } = renderHook(() => useSpacePlan())
    expect(result.current.plan?.status).toBe('active')
    expect(result.current.tierName).toBe('Business')
  })
})
