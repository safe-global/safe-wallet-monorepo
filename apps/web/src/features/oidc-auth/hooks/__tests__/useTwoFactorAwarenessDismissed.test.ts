import { act, renderHook } from '@/tests/test-utils'
import local from '@/services/local-storage/local'
import { TWO_FACTOR_AWARENESS_DISMISSED_KEY, useTwoFactorAwarenessDismissed } from '../useTwoFactorAwarenessDismissed'

describe('useTwoFactorAwarenessDismissed', () => {
  beforeEach(() => {
    local.removeItem(TWO_FACTOR_AWARENESS_DISMISSED_KEY)
  })

  it('starts out not dismissed', () => {
    const { result } = renderHook(() => useTwoFactorAwarenessDismissed())

    expect(result.current[0]).toBe(false)
  })

  it('persists the dismissal in local storage', () => {
    const { result } = renderHook(() => useTwoFactorAwarenessDismissed())

    act(() => result.current[1]())

    expect(result.current[0]).toBe(true)
    expect(local.getItem(TWO_FACTOR_AWARENESS_DISMISSED_KEY)).toBe(true)
  })

  it('reads a dismissal stored before mount', () => {
    local.setItem(TWO_FACTOR_AWARENESS_DISMISSED_KEY, true)

    const { result } = renderHook(() => useTwoFactorAwarenessDismissed())

    expect(result.current[0]).toBe(true)
  })
})
