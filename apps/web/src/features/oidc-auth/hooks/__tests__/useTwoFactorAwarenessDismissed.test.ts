import { act, renderHook } from '@/tests/test-utils'
import { twoFactorAwarenessDismissedStore, useTwoFactorAwarenessDismissed } from '../useTwoFactorAwarenessDismissed'

describe('useTwoFactorAwarenessDismissed', () => {
  beforeEach(() => {
    twoFactorAwarenessDismissedStore.setStore(false)
  })

  it('starts out not dismissed', () => {
    const { result } = renderHook(() => useTwoFactorAwarenessDismissed())

    expect(result.current[0]).toBe(false)
  })

  it('stays dismissed for every consumer once dismissed', () => {
    const first = renderHook(() => useTwoFactorAwarenessDismissed())
    const second = renderHook(() => useTwoFactorAwarenessDismissed())

    act(() => first.result.current[1]())

    expect(first.result.current[0]).toBe(true)
    expect(second.result.current[0]).toBe(true)
  })

  it('does not write to local storage', () => {
    const { result } = renderHook(() => useTwoFactorAwarenessDismissed())

    act(() => result.current[1]())

    expect(Object.keys(localStorage)).toHaveLength(0)
  })
})
