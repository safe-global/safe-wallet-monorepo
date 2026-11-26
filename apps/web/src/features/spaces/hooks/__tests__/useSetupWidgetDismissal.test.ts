import { faker } from '@faker-js/faker'
import { act, renderHook } from '@/tests/test-utils'
import local from '@/services/local-storage/local'
import { useSetupWidgetDismissal, DISMISS_COUNT_STORAGE_KEY, COMPLETED_STORAGE_KEY } from '../useSetupWidgetDismissal'

const DAY_MS = 24 * 60 * 60 * 1000
let spaceId: string

describe('useSetupWidgetDismissal', () => {
  beforeEach(() => {
    window.localStorage.clear()
    jest.useFakeTimers({ advanceTimers: false })
    spaceId = faker.string.uuid()
  })

  it('is not dismissed initially', () => {
    const { result } = renderHook(() => useSetupWidgetDismissal(spaceId))

    expect(result.current.isHidden).toBe(false)
  })

  it('hides for three days after a dismissal', () => {
    const { result, rerender } = renderHook(() => useSetupWidgetDismissal(spaceId))

    act(() => result.current.dismiss())
    expect(result.current.isHidden).toBe(true)

    act(() => jest.advanceTimersByTime(3 * DAY_MS + 1))
    rerender()

    expect(result.current.isHidden).toBe(false)
  })

  it('hides permanently after the third dismissal', () => {
    const { result, rerender } = renderHook(() => useSetupWidgetDismissal(spaceId))

    act(() => result.current.dismiss())
    act(() => result.current.dismiss())
    act(() => result.current.dismiss())

    act(() => jest.advanceTimersByTime(365 * DAY_MS))
    rerender()

    expect(result.current.isHidden).toBe(true)
    expect(local.getItem<Record<string, number>>(DISMISS_COUNT_STORAGE_KEY)?.[spaceId]).toBe(3)
  })

  it('counts dismissals per space', () => {
    const { result: space1 } = renderHook(() => useSetupWidgetDismissal(spaceId))
    const { result: space2 } = renderHook(() => useSetupWidgetDismissal(faker.string.uuid()))

    act(() => space1.current.dismiss())

    expect(space1.current.isHidden).toBe(true)
    expect(space2.current.isHidden).toBe(false)
  })

  it('hides a space that was marked completed before', () => {
    local.setItem(COMPLETED_STORAGE_KEY, { [spaceId]: true })

    const { result } = renderHook(() => useSetupWidgetDismissal(spaceId))

    expect(result.current.isHidden).toBe(true)
  })

  it('ignores dismiss without a space id', () => {
    const { result } = renderHook(() => useSetupWidgetDismissal(undefined))

    act(() => result.current.dismiss())

    expect(result.current.isHidden).toBe(false)
  })
})
