import { act, renderHook } from '@testing-library/react'
import { clearLocalStorageKey } from '@/tests/test-utils'
import useSetupWidgetState, {
  COMPLETED_STORAGE_KEY,
  DISMISS_COUNT_STORAGE_KEY,
  DISMISS_STORAGE_KEY,
} from '../useSetupWidgetState'

const SPACE_ID = '1'
const DAY_MS = 24 * 60 * 60 * 1000

describe('useSetupWidgetState', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
    ;[DISMISS_STORAGE_KEY, COMPLETED_STORAGE_KEY, DISMISS_COUNT_STORAGE_KEY].forEach(clearLocalStorageKey)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('is visible by default', () => {
    const { result } = renderHook(() => useSetupWidgetState(SPACE_ID))

    expect(result.current.isHidden).toBe(false)
  })

  it('hides for three days after a dismiss, then shows again', () => {
    const { result, rerender } = renderHook(() => useSetupWidgetState(SPACE_ID))

    act(() => result.current.dismiss())
    expect(result.current.isHidden).toBe(true)

    act(() => jest.setSystemTime(Date.now() + 3 * DAY_MS + 1))
    rerender()

    expect(result.current.isHidden).toBe(false)
  })

  it('hides permanently after the third dismiss', () => {
    const { result, rerender } = renderHook(() => useSetupWidgetState(SPACE_ID))

    for (let i = 0; i < 3; i++) {
      act(() => result.current.dismiss())
      act(() => jest.setSystemTime(Date.now() + 3 * DAY_MS + 1))
      rerender()
    }

    expect(result.current.isHidden).toBe(true)

    act(() => jest.setSystemTime(Date.now() + 365 * DAY_MS))
    rerender()

    expect(result.current.isHidden).toBe(true)
  })

  it('does not hide permanently after two dismisses', () => {
    const { result, rerender } = renderHook(() => useSetupWidgetState(SPACE_ID))

    for (let i = 0; i < 2; i++) {
      act(() => result.current.dismiss())
      act(() => jest.setSystemTime(Date.now() + 3 * DAY_MS + 1))
      rerender()
    }

    expect(result.current.isHidden).toBe(false)
  })

  it('counts dismisses per space', () => {
    const { result: first } = renderHook(() => useSetupWidgetState(SPACE_ID))
    const { result: second, rerender } = renderHook(() => useSetupWidgetState('2'))

    for (let i = 0; i < 3; i++) {
      act(() => first.current.dismiss())
    }
    rerender()

    expect(first.current.isHidden).toBe(true)
    expect(second.current.isHidden).toBe(false)
  })

  it('hides permanently once marked completed', () => {
    const { result } = renderHook(() => useSetupWidgetState(SPACE_ID))

    act(() => result.current.markCompleted())

    expect(result.current.isHidden).toBe(true)
  })
})
