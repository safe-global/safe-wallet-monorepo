import { act, renderHook } from '@/tests/test-utils'

import { useReport } from './useReport'

describe('useReport', () => {
  it('offers the plan action to an admin when the trial is ending', () => {
    const { result } = renderHook(() => useReport('trialEnding', true))

    expect(result.current.planNotice?.actionLabel).toBe('Choose a plan')
  })

  it('tells a member to ask an admin when the trial is ending', () => {
    const { result } = renderHook(() => useReport('trialEnding', false))

    expect(result.current.planNotice?.actionLabel).toBeUndefined()
    expect(result.current.planNotice?.description).toContain('Ask an admin')
  })

  it('replaces the report with a locked message when the Workspace is locked', () => {
    const { result } = renderHook(() => useReport('locked', true))

    expect(result.current.unavailable?.title).toBe('This Workspace is locked')
  })

  it('clears the unread notice and restores the full total after a retry', () => {
    const { result } = renderHook(() => useReport('unreadableSafe', true))
    const incompleteTotal = result.current.total

    act(() => result.current.onRetry())

    expect(result.current.unreadNotice).toBeUndefined()
    expect(result.current.total).not.toBe(incompleteTotal)
  })
})
